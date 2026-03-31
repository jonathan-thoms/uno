---
name: firebase-realtime-cart
description: Strict rules for Firestore database interactions, schema enforcement, and the collaborative real-time cart logic.
---

# Firebase Real-Time Cart Logic

## 1. Database Environment
- [cite_start]**Provider:** Firebase, specifically the Firestore Cloud Database[cite: 8].

## 2. Collaborative Syncing Rules
- **Real-Time Listeners:** You must use Firestore's `onSnapshot` listeners to subscribe to the active session document.
- [cite_start]**Instant Updates:** When one user adds an item, Firestore pushes the update to all other connected clients at the table instantly[cite: 9]. 
- **Concurrency & Race Conditions:** When adding or updating items in the `cart_items` sub-collection, use Firestore `runTransaction` or `arrayUnion`/`increment` operations to ensure data integrity if multiple users tap "Add" simultaneously.

## 3. Enforced Schema Definitions
When querying or writing data, strictly adhere to these collection structures:
- [cite_start]`restaurants`: Contains `restaurant_id` documents with basic settings[cite: 37, 38, 40].
- `tables`: Sub-collection under a restaurant. [cite_start]Contains `current_session_id` (Null if the table is empty)[cite: 41, 45].
- [cite_start]`sessions`: The core collection for the collaborative feature[cite: 46]. [cite_start]Contains `status` ("open", "ordered", "billed", "closed") and an array of temporary `users` IDs[cite: 50, 52].
- [cite_start]`cart_items`: A sub-collection inside a specific `session` document, tracking `item_id`, `quantity`, and `added_by`[cite: 54, 57, 58, 59].
- [cite_start]`menu_items`: Top-level collection containing pricing and `modifier_groups`[cite: 61, 68].

## 4. Security Rules (Target)
- Only allow reads/writes to a `session` document if the request originates from a device that has scanned the correct table QR code (validate via temporary auth tokens or session IDs).