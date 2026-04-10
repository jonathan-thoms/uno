# QR Code & Table Routing Specification

## The Core Concept
The QR code does not store the menu itself. It only stores a URL string containing the unique `table_id` from the Firestore database.

## Generation Logic (Manager App)
1. The Manager clicks "Add Table" and inputs Table Number "5".
2. The app writes a new document to the `tables` collection. Firestore generates a unique document ID (e.g., `table_abc123`).
3. The app renders a QR code using a React QR library.
4. The encoded value inside the QR code MUST be the exact URL pathway to the customer app: 
   `https://[APP_DOMAIN_OR_LOCALHOST]/table/table_abc123`

## Resolution Logic (Customer App — Host/Join Model)
When the customer scans the code, their phone's browser opens that URL. The React Router on the customer app catches the `/table/:tableId` parameter, grabs `table_abc123`, and immediately queries Firestore to check if that table has an active session.

1. **No active session:** The customer is prompted to enter a **nickname**, then becomes the **Host** of a new session. The session's `host_id` is set to their temporary device ID.
2. **Active session exists:** The customer is prompted to enter a **nickname**, then submits a **join request** to the session's `join_requests` sub-collection. They see a waiting screen until the Host approves or rejects them.

> **Anti-Sabotage Note:** This Host/Join model prevents external users from photographing a table's QR code and submitting orders remotely. Only users physically present at the table and approved by the Host can access the session.