# Firestore Database Schema (V1.0)
[cite_start]Structuring the data correctly is the most critical step for the collaborative cart to function without race conditions[cite: 36].

## `restaurants` Collection
* [cite_start]**Document ID:** `restaurant_id` [cite: 38]
* [cite_start]**name:** String [cite: 39]
* [cite_start]**settings:** Map (tax rates, currency, etc.) [cite: 40]

## `tables` Sub-collection
* [cite_start]**Document ID:** `table_id` [cite: 42]
* [cite_start]**table_number:** Integer [cite: 43]
* **qr_code_url:** String [cite: 44]
* [cite_start]**current_session_id:** String (Null if table is empty) [cite: 45]

## `sessions` Collection (Core)
* [cite_start]**Document ID:** `session_id` [cite: 47]
* [cite_start]**restaurant_id:** String [cite: 48]
* [cite_start]**table_id:** String [cite: 49]
* **status:** String ("open", "ordered", "billed", "closed") [cite: 50]
* [cite_start]**created_at:** Timestamp [cite: 51]
* **host_id:** String *(NEW — the user_id of the session creator/host who scanned the QR first)*
* **users:** Array of Maps *(UPDATED — each entry is `{ user_id: String, nickname: String }` instead of plain strings)*

### `join_requests` Sub-collection (inside sessions) *(NEW)*
> This sub-collection powers the Host/Join approval flow on the customer side. The staff side does NOT write to this collection but should be aware of its existence for schema consistency.

* **Document ID:** `request_id` (auto-generated)
* **user_id:** String (temporary device ID of the requester)
* **nickname:** String (display name entered by the requester)
* **status:** String (`"pending"` | `"approved"` | `"rejected"`)
* **requested_at:** Timestamp
* **responded_at:** Timestamp (Null until host acts)

### `cart_items` Sub-collection (inside sessions)
* [cite_start]**Document ID:** `cart_item_id` [cite: 55]
* [cite_start]**item_id:** String [cite: 57]
* [cite_start]**quantity:** Integer [cite: 58]
* **added_by:** String (User ID) [cite: 59]
* **added_by_nickname:** String *(NEW — display nickname of the user who added the item)*
* **modifiers:** Array [cite: 60]

## `menu_items` Collection
* [cite_start]**Document ID:** `item_id` [cite: 62]
* **name:** String [cite: 63]
* [cite_start]**price:** Number [cite: 64]
* [cite_start]**category:** String [cite: 66]
* **is_available:** Boolean [cite: 67]
* **modifier_groups:** Array of Maps [cite: 68]

## `online_orders` Collection *(NEW — Aggregator Integration)*
> This collection stores orders received from third-party delivery/pickup platforms (Swiggy, Zomato, etc.). The staff-side app manages the full lifecycle of these orders.

* **Document ID:** `online_order_id` (auto-generated)
* **platform:** String (`"swiggy"` | `"zomato"` | `"other"`)
* **platform_order_id:** String (the order ID from the external platform)
* **restaurant_id:** String
* **items:** Array of Maps (`{ name: String, quantity: Number, price: Number, modifiers: Array }`)
* **status:** String (`"received"`, `"preparing"`, `"ready"`, `"dispatched"`, `"completed"`)
* **customer_name:** String (from the platform)
* **customer_phone:** String (from the platform, if available)
* **order_type:** String (`"delivery"` | `"pickup"`)
* **total_amount:** Number
* **received_at:** Timestamp
* **updated_at:** Timestamp