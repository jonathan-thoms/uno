# User Experience & Application Flow (V1.0)

## Customer Flow: Collaborative Ordering
* **Step 1: Scan & Join:** Customer scans the table's QR code. The app captures the `table_id` and checks Firebase for an active session. It either creates a new room or drops the user into the existing shared session.
* **Step 2: Browse Menu:** The React PWA loads the categorized menu UI.
* **Step 3: Item Customization:** Customer selects an item and chooses applicable modifiers (e.g., "Extra Cheese") via a modal.
* **Step 4: Collaborative Sync:** Customer taps "Add to Cart." The database instantly updates the `cart_items` sub-collection, and the shared cart UI updates in real-time for everyone at the table.
* **Step 5: Smart Upsell:** Customer clicks "Checkout." A loading state triggers a call to the Python API, which returns "Frequently Bought Together" suggestions as a final modal before confirmation.
* **Step 6: Submit & Lock:** Customer confirms the order. The session status changes to `ordered`, locking the cart UI so no further edits can be made by the table.

## Staff Flow: Cashier & Fulfillment
* **Step 1: Monitor:** The Cashier Dashboard listens to the `sessions` collection and displays a grid of all tables.
* **Step 2: Receive Ticket:** The table's status shifts to `ordered`, triggering an alert and pushing the data to the kitchen view.
* **Step 3: Billing & Reset:** Once the meal is finished, the cashier processes payment. The session status is changed to `closed`, resetting the `current_session_id` on the table document to `null` for the next group.