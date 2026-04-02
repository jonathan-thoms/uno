---
name: firebase-admin-crud
description: Strict rules for Firebase Firestore admin operations, CRUD logic, and broad real-time listeners.
---

# Firebase Admin Operations Logic

## 1. Database Environment
- **Provider:** Firebase, specifically the Firestore Cloud Database.

## 2. Read/Listen Operations (The POS View)
- **Broad Listeners:** The Cashier POS must use `onSnapshot` to listen to the ENTIRE `tables` collection and queries against active `sessions`.
- **Performance:** When listening to `sessions`, query only where `status` is NOT "closed" to prevent downloading historical data into the live POS grid.

## 3. Write/CRUD Operations (Manager Authority)
- **Strict Schema Adherence:** All writes must strictly follow the `docs/DATABASE_SCHEMA.md`. 
- **Menu Management:** When creating `menu_items`, ensure `modifier_groups` are structured as valid arrays of maps. Do not allow loosely typed data.
- **Table & QR Generation:** When a table is created, the system must generate a document in the `tables` collection and output the `table_id` so the frontend can generate the specific QR code URL (`https://[domain]/table/{table_id}`).
- **Session Control:** The Cashier has the authority to update a `session` document's status to "closed" and must subsequently reset the associated `tables/{table_id}` document's `current_session_id` to `null`. Use Firestore Batched Writes or Transactions for these multi-document updates to ensure they succeed or fail together.

## 4. Authentication (V1 Scope)
- Require Firebase Auth to view any `/admin` or `/pos` routes. For V1, basic email/password authentication is sufficient without complex Role-Based Access Control (RBAC).