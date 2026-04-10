---
name: react-admin-dashboard
description: Architectural rules and patterns for the React Admin Dashboard (Manager, Cashier POS, and Online Order Aggregator views).
---

# React Admin Dashboard Guidelines

## 1. Core Tech Stack & Layout
- **Framework:** React using functional components and hooks exclusively.
- **Architecture:** Build as a standard Single Page Application (SPA).
- **Layout:** Desktop-first design. Use a persistent sidebar or top navigation architecture. The POS view must utilize maximum screen real estate (CSS Grid) to display multiple tables at once.
- **Styling:** Use Tailwind CSS. Prioritize high information density, clear typography, and distinct status colors (e.g., Red for Action Needed, Green for Open).

## 2. Form & State Management
- **Complex Forms:** For Menu CRUD operations (adding items, categories, and complex modifier groups), use controlled components or a library like `react-hook-form` to ensure data structure matches the database schema exactly before submission.
- **Local State:** Use React Context or standard state for UI toggles (modals, sidebars) and form drafts. 
- **Global State:** Rely on Firebase for the actual state of Tables and Orders.

## 3. Component Structure
- **Modularity:** Separate components logically by domain (e.g., `TableGrid`, `OrderTicket`, `MenuEditorForm`, `CategoryList`, `OnlineOrderCard`, `AggregatorOrderPanel`).
- **Separation of Concerns:** Keep complex Firebase write/update logic out of the presentation components. Wrap them in custom hooks or utility functions.

## 4. Online Order Aggregator UI (NEW)
- **Aggregator Panel:** Build an `AggregatorOrderPanel` (or a dedicated route/tab) that displays live orders from Swiggy, Zomato, and other platforms. This panel listens to the `online_orders` Firestore collection via `onSnapshot`.
- **Platform Badges:** Each online order card must display a clear visual badge indicating the source platform (e.g., Swiggy orange badge, Zomato red badge).
- **Status Workflow:** Each `OnlineOrderCard` must have buttons or controls to advance the order status through the lifecycle: `received` → `preparing` → `ready` → `dispatched` → `completed`.
- **Unified Kitchen View:** Consider a combined "Kitchen Display" view that interleaves dine-in table orders and online aggregator orders in a single chronological queue, each appropriately tagged.

## 5. Session Schema Awareness (Customer-Side Changes)
> The customer-side now uses a Host/Join model. When displaying session/user data on the staff-side:
- The `users` array in session documents now contains Maps with `{ user_id, nickname }` — display the **nickname** instead of raw user IDs.
- Cart items now include `added_by_nickname` — use this for display in the Order Fulfillment View.
- The `host_id` field identifies who started the session — this can optionally be highlighted in the staff UI.