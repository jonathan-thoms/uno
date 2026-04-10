# Product Requirements Document (V1.0)
**Project:** Next-Gen Restaurant Management System

## 1. System Architecture
[cite_start]To handle the real-time nature of collaborative table sessions alongside standard restaurant operations, a decoupled, serverless-friendly architecture is highly recommended for V1[cite: 3].

* [cite_start]**Customer & Staff Frontends:** Built using React[cite: 6]. [cite_start]This allows for a fast, responsive Single Page Application (SPA) or Progressive Web App (PWA) that loads instantly when a customer scans a QR code, even on slower mobile networks[cite: 6]. [cite_start]The same framework can power the Manager and Cashier dashboards[cite: 7].
* [cite_start]**Real-Time Database & Backend:** Firebase (specifically Firestore Cloud Database)[cite: 8]. [cite_start]Firestore's native real-time listeners are perfectly suited for the "shared cart" experience[cite: 8]. [cite_start]When one user adds an item, Firestore pushes the update to all other connected clients at the table instantly[cite: 9].
* [cite_start]**Analytics Microservice:** A separate backend service built in Python (using FastAPI or Flask)[cite: 10]. [cite_start]Python's data processing libraries make it the ideal environment for building the algorithmic upselling engine and generating insights from raw sales data[cite: 11].

## 2. Core Modules (Version 1.0 Scope)

### Module A: QR Collaborative Ordering (Customer App)
* **Session Initialization (Host/Join Model):** QR code encodes the `table_id`. When the first person scans the QR code for a table with no active session, they become the **Host** of a new session. They are prompted to enter a **nickname** before the session is created. The session document stores the host's user ID.
* **Join Request Flow (Anti-Sabotage):** When subsequent users scan the same table's QR code, they do NOT automatically join the session. Instead, they are prompted to enter a **nickname** and then a **join request** is sent to the Host. The Host sees a real-time notification and can **approve or reject** the request. This prevents anyone from photographing the QR code and placing malicious orders from outside the restaurant.
* **Join Request States:** A join request progresses through states: `pending` → `approved` / `rejected`. Only approved users gain access to the menu and shared cart.
* [cite_start]**Real-Time Cart Sync:** Cart state is maintained in the database, not local storage[cite: 16]. [cite_start]UI updates instantly via WebSocket/real-time listeners when any user at the table modifies the cart[cite: 17].
* [cite_start]**Algorithmic Upselling:** Before confirming the order, the system queries the Python microservice[cite: 18]. [cite_start]It uses general association rules (e.g., "70% of users who order a Burger also order Fries") to suggest add-ons[cite: 19]. (Note: V1 relies on aggregated item data, not personalized user profiles) [cite_start][cite: 20].
* [cite_start]**Checkout & Handoff:** Once submitted, the session status changes from open to ordered, locking the cart and pushing the ticket to the Cashier/Kitchen[cite: 21].

### Module B: Point of Sale & Cashier System
* [cite_start]**Table Management View:** A grid UI showing all tables and their current session status (Open, Ordered, Paying, Clean)[cite: 25].
* [cite_start]**Manual Order Entry:** A fallback interface allowing the cashier to manually add items to a table's session or create a walk-in order without a QR scan[cite: 26].
* [cite_start]**Payment Processing:** Finalizing bills, applying taxes/discounts, and closing the table session, which frees the table for the next group[cite: 27].

### Module E: Online Ordering Aggregator Integration (Staff-Side Only)
* **Aggregator Dashboard:** The staff-side interface integrates with third-party online ordering platforms (Swiggy, Zomato, etc.) to receive and manage delivery/pickup orders alongside dine-in orders.
* **Unified Order Queue:** Online orders from aggregators appear in the same Cashier/Kitchen interface as dine-in QR orders, tagged with their source platform for easy identification.
* **Menu Sync Awareness:** The system should support future menu synchronization between the internal menu and aggregator platform menus.

### Module C: Manager Dashboard
* [cite_start]**Menu CRUD Operations:** Interface to add, edit, or remove menu items, categories, prices, and modifiers[cite: 29].
* [cite_start]**Modifier Logic:** Setting rules for items (e.g., "Choose 1 base," "Add up to 3 toppings") to ensure clean data reaches the kitchen[cite: 30].

### Module D: Insights & Data Analytics
* [cite_start]**Sales Dashboards:** Daily, weekly, and monthly revenue tracking[cite: 32].
* [cite_start]**Profit Heatmaps:** Visual representation of peak ordering times to assist with staff scheduling[cite: 33].
* [cite_start]**Menu Engineering Data:** Reports highlighting top-selling items versus high-margin items, helping managers adjust pricing or menu placement[cite: 34].