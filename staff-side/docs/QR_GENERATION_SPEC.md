# QR Code & Table Routing Specification

## The Core Concept
The QR code does not store the menu itself. It only stores a URL string containing the unique `table_id` from the Firestore database.

## Generation Logic (Manager App)
1. The Manager clicks "Add Table" and inputs Table Number "5".
2. The app writes a new document to the `tables` collection. Firestore generates a unique document ID (e.g., `table_abc123`).
3. The app renders a QR code using a React QR library.
4. The encoded value inside the QR code MUST be the exact URL pathway to the customer app: 
   `https://[APP_DOMAIN_OR_LOCALHOST]/table/table_abc123`

## Resolution Logic (Customer App - Future Task)
When the customer scans the code, their phone's browser opens that URL. The React Router on the customer app catches the `/table/:tableId` parameter, grabs `table_abc123`, and immediately queries Firestore to check if that table has an active session.