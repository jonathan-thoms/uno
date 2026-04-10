---
name: react-pwa-frontend
description: Architectural rules and patterns for the React Progressive Web App (PWA) customer frontend, including the Host/Join session model UI.
---

# React PWA Frontend Guidelines

## 1. Core Tech Stack
- **Framework:** React using functional components and hooks exclusively.
- [cite_start]**Architecture:** Build as a fast, responsive Progressive Web App (PWA)[cite: 6]. [cite_start]The menu must load instantly when a customer scans a QR code, even on slower mobile networks[cite: 6].
- **Styling:** Use Tailwind CSS for utility-first, responsive design. Ensure high-contrast, touch-friendly tap targets for the mobile QR menu.

## 2. State Management (CRITICAL)
- **No Local Cart State:** Do NOT use `localStorage`, `sessionStorage`, or complex Redux stores for the shopping cart. 
- [cite_start]**Database Driven:** Cart state is maintained strictly in the database[cite: 16]. The frontend acts as a dumb terminal that simply renders the current state of the Firestore `sessions` document.
- [cite_start]**Reactivity:** UI updates must happen instantly via WebSocket/real-time listeners when any user at the table modifies the cart[cite: 17].

## 3. Host/Join Session UI Components (CRITICAL)
- **NicknameEntryScreen:** A screen/modal prompting the user to enter a display nickname before creating or requesting to join a session. This is shown to ALL users (both hosts and joiners).
- **HostApprovalPanel:** A floating notification panel or bottom sheet visible only to the Host. It displays incoming `join_requests` in real-time (filtered by `status == "pending"`). Each request shows the requester's nickname and Approve/Reject buttons.
- **WaitingForApprovalScreen:** Shown to joiners after submitting their join request. Displays a loading/waiting state with the message "Waiting for Host approval..." and listens to their join request document for status changes.
- **RequestDeniedScreen:** Shown to joiners whose request was rejected. Displays a "Request Denied" message with an option to retry (submit a new request) or leave.
- **Flow Routing:** The `/table/:tableId` route must implement this logic:
  1. Check for an active session on the table.
  2. If NO session → show `NicknameEntryScreen` → create session (user becomes Host) → redirect to menu.
  3. If session EXISTS → show `NicknameEntryScreen` → submit join request → show `WaitingForApprovalScreen` → on approval, redirect to menu; on rejection, show `RequestDeniedScreen`.

## 4. Component Structure
- **Modularity:** Break down the UI into small, reusable components (e.g., `MenuItemCard`, `SharedCartList`, `ModifierModal`, `NicknameEntryScreen`, `HostApprovalPanel`, `WaitingForApprovalScreen`).
- **Data Fetching:** Isolate Firebase database calls into custom hooks (e.g., `useTableSession(tableId)`, `useMenuItems()`, `useJoinRequests(sessionId)`, `useMyJoinRequest(sessionId, requestId)`) to keep UI components clean.