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

## Phase 3: Host/Join Session Model (Replaces old Session Initialization)
- [x] **3.1 Session Routing Logic:** Implement logic on the `/table/:tableId` route. When a user lands here, query the `tables/{tableId}` document.
- [x] **3.2 Nickname Entry Screen:** Build the `NicknameEntryScreen` component that prompts every user to enter a display nickname before proceeding. This screen is shown regardless of whether the user will become a Host or a Joiner.
- [x] **3.3 Host Session Creation:** If `current_session_id` is `null`, after nickname entry, create a new session document with the user as Host (`host_id` set to user's temporary ID), add their `{ user_id, nickname }` to the `users` array, and redirect to the menu.
- [x] **3.4 Join Request Submission:** If `current_session_id` exists, after nickname entry, write a join request document to `sessions/{sessionId}/join_requests` with `status: "pending"`, then show the `WaitingForApprovalScreen`.
- [x] **3.5 Waiting & Approval Listener:** Build the `WaitingForApprovalScreen` that uses `onSnapshot` on the joiner's own join request document. Transition to menu on `"approved"`, or show `RequestDeniedScreen` on `"rejected"`.
- [x] **3.6 Host Approval Panel:** Build the `HostApprovalPanel` overlay/notification that the Host sees. It listens to the `join_requests` sub-collection (filter: `status == "pending"`) and renders Approve/Reject buttons for each request.
- [x] **3.7 Approval Write Logic:** Implement the Approve action as an atomic batched write: update join request status to `"approved"` + add user to session's `users` array via `arrayUnion`. Implement the Reject action as a simple status update to `"rejected"`.
- [x] **3.8 Generate Temporary User ID:** Assign a random, temporary User ID (e.g., "Guest-482") to the current device/browser so their actions in the shared cart can be identified.

## Phase 4: The Real-Time Collaborative Cart
- [x] **4.1 `useTableSession` Hook:** Create a custom React hook that uses Firestore's `onSnapshot` to listen to the active `sessions/{sessionId}` document and its `cart_items` sub-collection. 
- [x] **4.2 Bind UI to Database State:** Connect the static UI built in Phase 2 entirely to the output of the `useTableSession` hook. The UI must react instantly to database changes.
- [x] **4.3 Add to Cart Logic:** Implement the function to write a new document to the `sessions/{sessionId}/cart_items` sub-collection when the user finishes selecting modifiers. Include `added_by_nickname` alongside `added_by`.
- [x] **4.4 Checkout/Lock Action:** Wire up the "Checkout" button to update the `sessions/{sessionId}` document's status from `open` to `ordered`. Ensure the UI visibly locks and prevents further cart additions once this state changes.