# Staff & Operations App Milestones (V1.0)

**Agent Instructions:**
Read this document to understand the current progress. Find the first unchecked `[ ]` task, implement it according to the `.agents/skills/react-pwa-frontend/SKILL.md` guidelines, and check off the box `[x]` upon successful verification. Ensure all database writes adhere strictly to the `docs/DATABASE_SCHEMA.md`.

## Phase 1: Admin Scaffolding & Auth
- [x] **1.1 Initialize Admin Layout:** Build a React shell with a persistent sidebar containing navigation links: Dashboard, Menu Management, Table Management, and Active Orders.
- [x] **1.2 Basic Authentication:** Implement a simple login screen using Firebase Auth to restrict access to the `/admin` routes. (For V1, a single admin/manager login is sufficient).

## Phase 2: Table & QR Management
- [x] **2.1 Table CRUD UI:** Build a page to manage the `tables` sub-collection (under a hardcoded `restaurant_id` for V1). Managers should be able to click "Add Table" and assign a `table_number`.
- [x] **2.2 QR Code Generation:** Integrate a library (like `qrcode.react`) into the Table UI. When a table is created, generate a visual QR code that encodes the URL: `https://[your-domain]/table/{table_id}`.
- [x] **2.3 Print View:** Create a simple, printable layout for the generated QR codes so the manager can physically print and place them on the tables.

## Phase 3: Menu Management (Manager)
- [x] **3.1 Menu Category UI:** Build the interface to add, edit, and delete categories (e.g., "Starters", "Mains").
- [x] **3.2 Item CRUD Operations:** Create a form to add items to the `menu_items` collection. The form must include fields for: Name, Price, Category, and a toggle for `is_available`.
- [x] **3.3 Modifier Groups (Crucial):** Add a section within the item form to attach `modifier_groups` (e.g., Name: "Add-ons", Options: ["Extra Cheese - ₹50", "Bacon - ₹100"], Rules: "Select up to 2").

## Phase 4: Cashier POS & Live Orders
- [x] **4.1 Active Tables Grid:** Build a visual dashboard showing all tables. Use Firestore `onSnapshot` to listen to the `tables` and `sessions` collections.
- [x] **4.2 Status Indicators:** Color-code the tables based on their `current_session_id` status (e.g., Grey = Empty, Green = Open/Browsing, Red = Ordered/Kitchen Prep, Yellow = Billed).
- [x] **4.3 Order Fulfillment View:** When a table is clicked, display the full list of `cart_items` for that session. Display the `added_by_nickname` field to show which guest added each item.
- [x] **4.4 Checkout & Reset:** Add a "Mark as Paid" button. This must update the `sessions` document status to `closed` AND reset the `tables/{table_id}` document's `current_session_id` back to `null`.

## Phase 5: Online Ordering Aggregator Integration (NEW)
- [ ] **5.1 `online_orders` Collection Setup:** Ensure the `online_orders` collection exists in Firestore and matches the schema defined in `docs/DATABASE_SCHEMA.md`. Create seed/test data for development.
- [ ] **5.2 Aggregator Order Panel UI:** Build an `AggregatorOrderPanel` component (accessible from the sidebar as "Online Orders" or integrated as a tab in the POS view). This panel uses `onSnapshot` on the `online_orders` collection (filtered: `status != "completed"`) to display live orders.
- [ ] **5.3 Platform Badges & Styling:** Each online order card displays a visual badge indicating the source platform (Swiggy, Zomato, etc.) with distinct brand colors. Order cards show: platform, customer name, order type (delivery/pickup), items list, and total amount.
- [ ] **5.4 Status Workflow Controls:** Each `OnlineOrderCard` has action buttons to advance the order through its lifecycle: `received` → `preparing` → `ready` → `dispatched` → `completed`. Each status update writes to the Firestore document's `status` and `updated_at` fields.
- [ ] **5.5 Unified Kitchen Display (Optional V1):** Build a combined view that merges dine-in table orders (`sessions` with status `ordered`) and online orders (`online_orders` with status `received` or `preparing`) into a single chronological kitchen queue, each tagged with its source.

## Phase 6: Session Schema Compatibility (NEW — Required)
> The customer-side now uses a Host/Join model for sessions. These changes affect how session data appears on the staff side.

- [ ] **6.1 Nickname Display:** Update the Order Fulfillment View (Phase 4.3) to display user **nicknames** from the `users` array (now `{ user_id, nickname }` maps) and `added_by_nickname` from cart items, instead of raw user IDs.
- [ ] **6.2 Host Indicator (Optional):** In the session detail view, optionally highlight or badge the Host user using the `host_id` field on the session document.