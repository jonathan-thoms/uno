---
name: react-pwa-frontend
description: Architectural rules and patterns for the React Progressive Web App (PWA) customer frontend and staff dashboards.
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

## 3. Component Structure
- **Modularity:** Break down the UI into small, reusable components (e.g., `MenuItemCard`, `SharedCartList`, `ModifierModal`).
- **Data Fetching:** Isolate Firebase database calls into custom hooks (e.g., `useTableSession(tableId)`, `useMenuItems()`) to keep UI components clean.