# Customer App Development Milestones (V1.0)

**Agent Instructions:**
Read this document to understand the current progress. Find the first unchecked `[ ]` task, implement it according to the `.agents/skills/` guidelines, and then check off the box `[x]` upon successful verification. Do not proceed to the next phase until the current phase is fully tested and functional.

## Phase 1: Foundation & Scaffolding
- [x] **1.1 Initialize React PWA:** Set up a new React application (using Vite) optimized for PWA standards.
- [x] **1.2 Install Core Dependencies:** Install `firebase`, `react-router-dom`, `tailwindcss`, `lucide-react` (for icons), and configure Tailwind.
- [x] **1.3 Firebase Configuration:** Create `src/lib/firebase.js` and initialize the Firebase app and Firestore instance using environment variables. 
- [x] **1.4 Routing Setup:** Implement standard React Router routes:
  - `/` (Home/Landing - fallback)
  - `/table/:tableId` (The core entry point from a QR scan)
  - `/cart` (The shared cart view)

## Phase 2: Static UI Components (No DB yet)
- [x] **2.1 Layout Shell:** Build a responsive, mobile-first layout wrapper containing a top navigation bar (showing table number) and a sticky bottom bar (showing cart total/checkout button).
- [x] **2.2 Menu UI:** Create standard components: `MenuCategorySection` and `MenuItemCard` (showing name, price, description, and an "Add" button).
- [x] **2.3 Modifier Modal:** Build a modal that pops up when an item is selected, allowing the user to select predefined modifiers (e.g., Extra Cheese) before adding to the cart.
- [x] **2.4 Shared Cart UI:** Build the cart view that lists items, quantities, and ideally a small badge indicating *who* added the item (using generic names/IDs for now).

## Phase 3: Firebase Session Initialization
- [x] **3.1 Session Routing Logic:** Implement logic on the `/table/:tableId` route. When a user lands here, query the `tables/{tableId}` document.
- [x] **3.2 Create/Join Session:** - If `current_session_id` is `null`, create a new document in the `sessions` collection (status: 'open') and update the table document.
  - If `current_session_id` exists, store that session ID in the frontend's local context (React Context) so the app knows which room to listen to.
- [x] **3.3 Generate Temporary User ID:** Assign a random, temporary User ID (e.g., "Guest-482") to the current device/browser so their actions in the shared cart can be identified.

## Phase 4: The Real-Time Collaborative Cart
- [ ] **4.1 `useTableSession` Hook:** Create a custom React hook that uses Firestore's `onSnapshot` to listen to the active `sessions/{sessionId}` document and its `cart_items` sub-collection. 
- [ ] **4.2 Bind UI to Database State:** Connect the static UI built in Phase 2 entirely to the output of the `useTableSession` hook. The UI must react instantly to database changes.
- [ ] **4.3 Add to Cart Logic:** Implement the function to write a new document to the `sessions/{sessionId}/cart_items` sub-collection when the user finishes selecting modifiers.
- [ ] **4.4 Checkout/Lock Action:** Wire up the "Checkout" button to update the `sessions/{sessionId}` document's status from `open` to `ordered`. Ensure the UI visibly locks and prevents further cart additions once this state changes.