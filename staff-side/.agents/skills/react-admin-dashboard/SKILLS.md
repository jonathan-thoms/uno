---
name: react-admin-dashboard
description: Architectural rules and patterns for the React Admin Dashboard (Manager & Cashier POS).
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
- **Modularity:** Separate components logically by domain (e.g., `TableGrid`, `OrderTicket`, `MenuEditorForm`, `CategoryList`).
- **Separation of Concerns:** Keep complex Firebase write/update logic out of the presentation components. Wrap them in custom hooks or utility functions.