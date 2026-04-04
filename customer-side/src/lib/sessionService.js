import {
  doc,
  getDoc,
  addDoc,
  updateDoc,
  collection,
  serverTimestamp,
  runTransaction,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';
import { RESTAURANT_ID } from '../constants';

/**
 * Fetch a table document from Firestore.
 * Path: restaurants/{restaurantId}/tables/{tableId}
 */
export async function getTableDoc(tableId) {
  const tableRef = doc(db, 'restaurants', RESTAURANT_ID, 'tables', tableId);
  const snap = await getDoc(tableRef);
  if (!snap.exists()) {
    return null;
  }
  return { id: snap.id, ...snap.data() };
}

/**
 * Create a new session and link it to the table.
 * Uses a Firestore transaction to prevent race conditions
 * (two users scanning the QR code at the same time).
 *
 * Returns the new session ID.
 */
export async function createNewSession(tableId, guestId) {
  const tableRef = doc(db, 'restaurants', RESTAURANT_ID, 'tables', tableId);
  const sessionsRef = collection(db, 'sessions');

  // We can't use addDoc inside a transaction, so we do a two-step approach:
  // 1. Read table inside transaction to confirm no session exists
  // 2. Create session doc outside transaction, then update table inside transaction
  // Actually, Firestore transactions can create new docs with doc() + set().

  const sessionId = await runTransaction(db, async (transaction) => {
    const tableSnap = await transaction.get(tableRef);

    if (!tableSnap.exists()) {
      throw new Error('TABLE_NOT_FOUND');
    }

    const tableData = tableSnap.data();

    // If a session was created between our initial check and now, just join it
    if (tableData.current_session_id) {
      return tableData.current_session_id;
    }

    // Create new session document
    const newSessionRef = doc(sessionsRef);
    transaction.set(newSessionRef, {
      restaurant_id: RESTAURANT_ID,
      table_id: tableId,
      status: 'open',
      created_at: serverTimestamp(),
      users: [guestId],
    });

    // Link session to table
    transaction.update(tableRef, {
      current_session_id: newSessionRef.id,
    });

    return newSessionRef.id;
  });

  return sessionId;
}

/**
 * Add a user (guest ID) to an existing session's users array.
 */
export async function addUserToSession(sessionId, guestId) {
  const sessionRef = doc(db, 'sessions', sessionId);
  await updateDoc(sessionRef, {
    users: arrayUnion(guestId),
  });
}

/**
 * Fetch a session document.
 */
export async function getSessionDoc(sessionId) {
  const sessionRef = doc(db, 'sessions', sessionId);
  const snap = await getDoc(sessionRef);
  if (!snap.exists()) {
    return null;
  }
  return { id: snap.id, ...snap.data() };
}
