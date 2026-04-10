# User Experience & Application Flow (V1.0)

## Customer Flow: Collaborative Ordering (Host/Join Model)

### Host Flow (First Person at the Table)
* **Step 1: Scan QR:** The first customer scans the table's QR code. The app captures the `table_id` and checks Firebase for an active session. No active session is found.
* **Step 2: Enter Nickname:** The customer is prompted to enter a display nickname (e.g., "Rahul"). This becomes their identity in the shared cart.
* **Step 3: Become Host:** A new session is created with this user as the **Host**. The session document stores their `user_id` in a `host_id` field. The Host is redirected to the menu.
* **Step 4: Manage Join Requests:** While browsing the menu, the Host receives **real-time notifications** when other people scan the same table QR and request to join. A small panel or modal shows pending requests with the requester's nickname. The Host can **Approve** or **Reject** each request.
* **Step 5: Browse, Customize & Order:** The Host browses the menu, customizes items with modifiers, adds to the shared cart, and eventually checks out — same as collaborators.

### Joiner Flow (Subsequent People at the Table)
* **Step 1: Scan QR:** A subsequent customer scans the same table's QR code. The app finds an existing active session.
* **Step 2: Enter Nickname:** The customer is prompted to enter a display nickname (e.g., "Priya").
* **Step 3: Request to Join:** A join request document is written to the session's `join_requests` sub-collection with status `pending`. The customer sees a **"Waiting for Host approval..."** screen.
* **Step 4: Approved → Enter Session:** Once the Host approves, the customer's request status changes to `approved` (detected via `onSnapshot`). The waiting screen transitions to the full menu UI, and the customer is added to the session's `users` array.
* **Step 4 (Alt): Rejected → Denied Screen:** If the Host rejects the request, the customer sees a "Request Denied" screen with an option to retry or leave.
* **Step 5: Collaborate:** Once inside the session, the Joiner has the same menu browsing, cart adding, and real-time sync capabilities as the Host.

### Shared Steps (All Approved Users)
* **Browse Menu:** The React PWA loads the categorized menu UI.
* **Item Customization:** Customer selects an item and chooses applicable modifiers (e.g., "Extra Cheese") via a modal.
* **Collaborative Sync:** Customer taps "Add to Cart." The database instantly updates the `cart_items` sub-collection, and the shared cart UI updates in real-time for everyone at the table. Each item shows the nickname of who added it.
* **Smart Upsell:** Customer clicks "Checkout." A loading state triggers a call to the Python API, which returns "Frequently Bought Together" suggestions as a final modal before confirmation.
* **Submit & Lock:** Customer confirms the order. The session status changes to `ordered`, locking the cart UI so no further edits can be made by the table.

## Staff Flow: Cashier & Fulfillment
* **Step 1: Monitor:** The Cashier Dashboard listens to the `sessions` collection and displays a grid of all tables. Online orders from aggregator platforms (Swiggy, Zomato) appear in a separate panel or as virtual "tables" tagged with the platform source.
* **Step 2: Receive Ticket:** The table's status shifts to `ordered`, triggering an alert and pushing the data to the kitchen view. Aggregator orders trigger the same kitchen alert flow.
* **Step 3: Billing & Reset:** Once the meal is finished, the cashier processes payment. The session status is changed to `closed`, resetting the `current_session_id` on the table document to `null` for the next group. For aggregator orders, the status is synced back to the platform where applicable.