import {
  doc,
  getDoc,
  addDoc,
  updateDoc,
  collection,
  serverTimestamp,
  runTransaction,
  arrayUnion,
  onSnapshot,
  query,
  where,
  writeBatch,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { RESTAURANT_ID } from '../constants';

// ─── Helper: canonical Firestore paths ───
const tablesCol = () => collection(db, 'restaurants', RESTAURANT_ID, 'tables');
const tableDoc = (tableId) => doc(db, 'restaurants', RESTAURANT_ID, 'tables', tableId);
const sessionsCol = () => collection(db, 'restaurants', RESTAURANT_ID, 'sessions');
const sessionDoc = (sessionId) => doc(db, 'restaurants', RESTAURANT_ID, 'sessions', sessionId);
const cartItemsCol = (sessionId) => collection(db, 'restaurants', RESTAURANT_ID, 'sessions', sessionId, 'cart_items');
const joinRequestsCol = (sessionId) => collection(db, 'restaurants', RESTAURANT_ID, 'sessions', sessionId, 'join_requests');
const joinRequestDoc = (sessionId, requestId) => doc(db, 'restaurants', RESTAURANT_ID, 'sessions', sessionId, 'join_requests', requestId);
const menuItemsCol = () => collection(db, 'restaurants', RESTAURANT_ID, 'menu_items');

// ─── Table Operations ───

export async function getTableDoc(tableId) {
  const snap = await getDoc(tableDoc(tableId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ─── Session Operations ───

export async function getSessionDoc(sessionId) {
  const snap = await getDoc(sessionDoc(sessionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Create a new session as Host.
 * - Sets host_id to the user's device ID
 * - Stores user as { user_id, nickname } in the users array
 * - Links session to the table document
 * - Uses a transaction to prevent race conditions
 *
 * Returns { sessionId, alreadyExisted }
 */
export async function createHostSession(tableId, userId, nickname) {
  const tRef = tableDoc(tableId);

  const result = await runTransaction(db, async (transaction) => {
    const tableSnap = await transaction.get(tRef);
    if (!tableSnap.exists()) throw new Error('TABLE_NOT_FOUND');

    const tableData = tableSnap.data();

    // Race condition guard: if a session was created between checks
    if (tableData.current_session_id) {
      return { sessionId: tableData.current_session_id, alreadyExisted: true };
    }

    const newSessionRef = doc(sessionsCol());
    transaction.set(newSessionRef, {
      restaurant_id: RESTAURANT_ID,
      table_id: tableId,
      status: 'open',
      created_at: serverTimestamp(),
      host_id: userId,
      users: [{ user_id: userId, nickname }],
    });

    transaction.update(tRef, { current_session_id: newSessionRef.id });

    return { sessionId: newSessionRef.id, alreadyExisted: false };
  });

  return result;
}

// ─── Join Request Operations ───

/**
 * Submit a join request to an existing session.
 * Returns the join request document ID.
 */
export async function submitJoinRequest(sessionId, userId, nickname) {
  const ref = await addDoc(joinRequestsCol(sessionId), {
    user_id: userId,
    nickname,
    status: 'pending',
    requested_at: serverTimestamp(),
    responded_at: null,
  });
  return ref.id;
}

/**
 * Listen to a specific join request for status changes.
 * Callback receives { id, ...data } on every update.
 * Returns unsubscribe function.
 */
export function listenToJoinRequest(sessionId, requestId, callback) {
  return onSnapshot(joinRequestDoc(sessionId, requestId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    }
  });
}

/**
 * Listen to all pending join requests for a session (used by Host).
 * Callback receives an array of request docs.
 * Returns unsubscribe function.
 */
export function listenToPendingJoinRequests(sessionId, callback) {
  const q = query(
    joinRequestsCol(sessionId),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(requests);
  });
}

/**
 * Approve a join request (batched write):
 * 1. Update request status to "approved"
 * 2. Add user to session's users array
 */
export async function approveJoinRequest(sessionId, requestId, userId, nickname) {
  const batch = writeBatch(db);

  batch.update(joinRequestDoc(sessionId, requestId), {
    status: 'approved',
    responded_at: serverTimestamp(),
  });

  batch.update(sessionDoc(sessionId), {
    users: arrayUnion({ user_id: userId, nickname }),
  });

  await batch.commit();
}

/**
 * Reject a join request.
 */
export async function rejectJoinRequest(sessionId, requestId) {
  await updateDoc(joinRequestDoc(sessionId, requestId), {
    status: 'rejected',
    responded_at: serverTimestamp(),
  });
}

// ─── Real-Time Listeners ───

/**
 * Listen to a session document in real-time.
 * Returns unsubscribe function.
 */
export function listenToSession(sessionId, callback) {
  return onSnapshot(sessionDoc(sessionId), (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    }
  });
}

/**
 * Listen to cart items sub-collection in real-time.
 * Returns unsubscribe function.
 */
export function listenToCartItems(sessionId, callback) {
  return onSnapshot(cartItemsCol(sessionId), (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
}

/**
 * Listen to available menu items.
 * Returns unsubscribe function.
 */
export function listenToMenuItems(callback) {
  const q = query(menuItemsCol(), where('is_available', '==', true));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(items);
  });
}

// ─── Cart Write Operations ───

/**
 * Add an item to the session's cart.
 */
export async function addCartItem(sessionId, { itemId, itemName, itemPrice, quantity, modifiers, userId, nickname }) {
  await addDoc(cartItemsCol(sessionId), {
    item_id: itemId,
    item_name: itemName,
    item_price: itemPrice || 0,
    quantity: quantity || 1,
    modifiers: modifiers || [],
    added_by: userId,
    added_by_nickname: nickname,
    added_at: serverTimestamp(),
  });
}

/**
 * Submit the order: change session status to "ordered".
 * This locks the cart for all users.
 */
export async function submitOrder(sessionId) {
  await updateDoc(sessionDoc(sessionId), {
    status: 'ordered',
    ordered_at: serverTimestamp(),
  });
}
