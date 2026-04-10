---
name: firebase-realtime-cart
description: Strict rules for Firestore database interactions, schema enforcement, the Host/Join session model, and the collaborative real-time cart logic.
---

# Firebase Real-Time Cart Logic

## 1. Database Environment
- [cite_start]**Provider:** Firebase, specifically the Firestore Cloud Database[cite: 8].

## 2. Session Initialization (Host/Join Model)
- **Host Creation:** When the first user scans a table QR with no active session, they enter a nickname and become the **Host**. A new `sessions` document is created with their `user_id` stored in the `host_id` field and their nickname in the `users` array (as a map: `{ user_id, nickname }`).
- **Join Request Flow:** When subsequent users scan the same table QR, they enter a nickname and a document is written to the `sessions/{sessionId}/join_requests` sub-collection with `status: "pending"`. The user's UI must listen to their own join request document via `onSnapshot` and transition when the status changes to `"approved"` or `"rejected"`.
- **Host Notifications:** The Host's UI must use `onSnapshot` on the `join_requests` sub-collection (filtered by `status == "pending"`) to display incoming join requests in real-time.
- **Approval Action:** When the Host approves a join request, two writes happen atomically (use Batched Write or Transaction):
  1. Update the `join_requests/{requestId}` document's `status` to `"approved"` and set `responded_at`.
  2. Add the approved user's `{ user_id, nickname }` to the `sessions/{sessionId}` document's `users` array via `arrayUnion`.
- **Rejection Action:** When the Host rejects a request, only the `join_requests/{requestId}` document's `status` is updated to `"rejected"`.

## 3. Collaborative Syncing Rules
- **Real-Time Listeners:** You must use Firestore's `onSnapshot` listeners to subscribe to the active session document.
- [cite_start]**Instant Updates:** When one user adds an item, Firestore pushes the update to all other connected clients at the table instantly[cite: 9]. 
- **Concurrency & Race Conditions:** When adding or updating items in the `cart_items` sub-collection, use Firestore `runTransaction` or `arrayUnion`/`increment` operations to ensure data integrity if multiple users tap "Add" simultaneously.

## 4. Enforced Schema Definitions
When querying or writing data, strictly adhere to these collection structures:
- [cite_start]`restaurants`: Contains `restaurant_id` documents with basic settings[cite: 37, 38, 40].
- `tables`: Sub-collection under a restaurant. [cite_start]Contains `current_session_id` (Null if the table is empty)[cite: 41, 45].
- [cite_start]`sessions`: The core collection for the collaborative feature[cite: 46]. Contains `status` ("open", "ordered", "billed", "closed"), a `host_id` field, and an array of `users` (each a map with `user_id` and `nickname`).
- `join_requests`: A sub-collection inside a specific `session` document, containing `user_id`, `nickname`, `status` ("pending", "approved", "rejected"), `requested_at`, and `responded_at`.
- [cite_start]`cart_items`: A sub-collection inside a specific `session` document, tracking `item_id`, `quantity`, `added_by`, `added_by_nickname`, and `modifiers`[cite: 54, 57, 58, 59].
- [cite_start]`menu_items`: Top-level collection containing pricing and `modifier_groups`[cite: 61, 68].

## 5. Security Rules (Target)
- Only allow reads/writes to a `session` document if the requesting user's `user_id` exists in the session's `users` array (i.e., they have been approved by the Host).
- Only the Host (`host_id`) can approve or reject `join_requests`.
- Join request documents can be created by any authenticated/anonymous user, but only with `status: "pending"`.