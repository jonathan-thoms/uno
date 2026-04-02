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
* **users:** Array of Strings (Temporary IDs assigned to devices at the table) [cite: 52]

## `cart_items` Sub-collection (inside sessions)
* [cite_start]**Document ID:** `cart_item_id` [cite: 55]
* [cite_start]**item_id:** String [cite: 57]
* [cite_start]**quantity:** Integer [cite: 58]
* **added_by:** String (User ID) [cite: 59]
* **modifiers:** Array [cite: 60]

## `menu_items` Collection
* [cite_start]**Document ID:** `item_id` [cite: 62]
* **name:** String [cite: 63]
* [cite_start]**price:** Number [cite: 64]
* [cite_start]**category:** String [cite: 66]
* **is_available:** Boolean [cite: 67]
* **modifier_groups:** Array of Maps [cite: 68]