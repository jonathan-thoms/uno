---
name: firebase-admin-crud
description: Strict rules for Firebase Firestore admin operations, CRUD logic, broad real-time listeners, and online ordering aggregator integration.
---

# Firebase Admin Operations Logic

## 1. Database Environment
- **Provider:** Firebase, specifically the Firestore Cloud Database.

## 2. Read/Listen Operations (The POS View)
- **Broad Listeners:** The Cashier POS must use `onSnapshot` to listen to the ENTIRE `tables` collection and queries against active `sessions`.
- **Performance:** When listening to `sessions`, query only where `status` is NOT "closed" to prevent downloading historical data into the live POS grid.
- **Online Orders Listener:** The POS must ALSO use `onSnapshot` on the `online_orders` collection (filtered by `status` NOT "completed") to display active aggregator orders in real-time alongside dine-in table orders.

## 3. Write/CRUD Operations (Manager Authority)
- **Strict Schema Adherence:** All writes must strictly follow the `docs/DATABASE_SCHEMA.md`. 
- **Menu Management:** When creating `menu_items`, ensure `modifier_groups` are structured as valid arrays of maps. Do not allow loosely typed data.
- **Table & QR Generation:** When a table is created, the system must generate a document in the `tables` collection and output the `table_id` so the frontend can generate the specific QR code URL (`https://[domain]/table/{table_id}`).
- **Session Control:** The Cashier has the authority to update a `session` document's status to "closed" and must subsequently reset the associated `tables/{table_id}` document's `current_session_id` to `null`. Use Firestore Batched Writes or Transactions for these multi-document updates to ensure they succeed or fail together.

## 4. Online Order Aggregator Operations (NEW)
- **Order Ingestion:** Online orders from Swiggy, Zomato, and other platforms are stored in the `online_orders` collection. Each document must include `platform`, `platform_order_id`, `items`, `status`, `customer_name`, `order_type`, and timestamps.
- **Status Updates:** Staff update the `status` field of `online_orders` documents as orders progress through the lifecycle: `received` → `preparing` → `ready` → `dispatched` → `completed`.
- **Schema Separation:** Online orders use a SEPARATE `online_orders` collection — do NOT mix them into the `sessions` collection which is reserved for dine-in QR-based orders.
- **Display Integration:** The POS view renders online orders alongside (but visually distinct from) dine-in table orders, with clear platform badges (Swiggy, Zomato, etc.).

## 5. Session Schema Awareness (Customer-Side Changes)
> The customer-side now uses a **Host/Join model** for session creation. The staff-side should be aware of these schema changes but does NOT need to implement the Host/Join UI logic:
- Sessions now have a `host_id` field (String) identifying the session creator.
- The `users` array now contains Maps (`{ user_id, nickname }`) instead of plain strings.
- Sessions have a new `join_requests` sub-collection for the approval flow. The staff-side should NOT read or write to this sub-collection.
- Cart items now include an `added_by_nickname` field alongside `added_by`.

## 6. Authentication (V1 Scope)
- Require Firebase Auth to view any `/admin` or `/pos` routes. For V1, basic email/password authentication is sufficient without complex Role-Based Access Control (RBAC).