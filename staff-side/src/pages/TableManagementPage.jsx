import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { RESTAURANT_ID, APP_BASE_URL } from '../constants';
import { QRCodeSVG } from 'qrcode.react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  HiOutlineQrcode,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePrinter,
  HiOutlineX,
  HiOutlineExclamation,
} from 'react-icons/hi';

export default function TableManagementPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showPrintView, setShowPrintView] = useState(false);

  // Delete confirmation state
  const [confirmDelete, setConfirmDelete] = useState(null); // { id, table_number }

  // Real-time listener for the tables sub-collection
  useEffect(() => {
    const tablesRef = collection(db, 'restaurants', RESTAURANT_ID, 'tables');
    const q = query(tablesRef, orderBy('table_number', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tablesData = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setTables(tablesData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Add a new table
  async function handleAddTable(e) {
    e.preventDefault();
    const num = parseInt(newTableNumber, 10);
    if (isNaN(num) || num <= 0) return;

    // Check for duplicate table number
    if (tables.some((t) => t.table_number === num)) {
      alert(`Table #${num} already exists.`);
      return;
    }

    setAdding(true);
    try {
      const tablesRef = collection(db, 'restaurants', RESTAURANT_ID, 'tables');
      await addDoc(tablesRef, {
        table_number: num,
        current_session_id: null,
        created_at: serverTimestamp(),
      });
      setNewTableNumber('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding table:', err);
      alert('Failed to add table. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  // Delete a table (called from confirmation modal)
  async function executeDeleteTable() {
    if (!confirmDelete) return;

    setDeletingId(confirmDelete.id);
    try {
      const tableDoc = doc(db, 'restaurants', RESTAURANT_ID, 'tables', confirmDelete.id);
      await deleteDoc(tableDoc);
      // If we were viewing this table, clear selection
      if (selectedTable?.id === confirmDelete.id) {
        setSelectedTable(null);
      }
    } catch (err) {
      console.error('Error deleting table:', err);
      alert('Failed to delete table. Check Firestore rules or try again.');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  // Generate the QR URL for a table
  function getQRUrl(tableId) {
    return `${APP_BASE_URL}/table/${tableId}`;
  }

  // Print handler: opens a new window with just the QR codes
  function handlePrint() {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Please allow popups for this site to print QR codes.');
      return;
    }

    const qrCardsHTML = tables.map((table) => {
      const qrSvgString = renderToStaticMarkup(
        <QRCodeSVG
          value={getQRUrl(table.id)}
          size={180}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
          includeMargin
        />
      );

      return `
        <div class="qr-card">
          <div class="qr-code-wrapper">${qrSvgString}</div>
          <div class="qr-label">
            <span class="brand">UNO</span>
            <span class="table-name">Table #${table.table_number}</span>
            <span class="instruction">Scan to view menu & order</span>
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>UNO — QR Codes</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', -apple-system, sans-serif; padding: 24px; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .qr-card {
            border: 1px solid #ddd; border-radius: 12px; padding: 24px;
            display: flex; flex-direction: column; align-items: center;
            gap: 12px; text-align: center; page-break-inside: avoid;
          }
          .qr-code-wrapper svg {
            display: block;
            max-width: 100%;
            height: auto;
          }
          .qr-label { display: flex; flex-direction: column; gap: 2px; }
          .brand { font-size: 1.1rem; font-weight: 800; color: #0c0e14; }
          .table-name { font-size: 1rem; font-weight: 600; color: #1a1e2b; }
          .instruction { font-size: 0.75rem; color: #5e6278; margin-top: 4px; }
          @media print {
            .no-print { display: none !important; }
            .grid { grid-template-columns: repeat(3, 1fr); }
            .qr-card { break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom:20px;text-align:center;">
          <button onclick="window.print()" style="padding:10px 24px;font-size:14px;font-weight:600;background:#f59e0b;color:#0c0e14;border:none;border-radius:8px;cursor:pointer;">
            🖨 Print QR Codes
          </button>
        </div>
        <div class="grid">${qrCardsHTML}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  if (loading) {
    return (
      <div className="page-placeholder-container">
        <div className="page-header">
          <h1 className="page-title">Table Management</h1>
        </div>
        <div className="loading-screen" style={{ height: '40vh' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="table-mgmt">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Table Management</h1>
          <p className="page-subtitle">
            {tables.length} table{tables.length !== 1 ? 's' : ''} configured &bull; Click any table to view its QR code
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {tables.length > 0 && (
            <button
              className="btn btn--secondary"
              onClick={handlePrint}
              id="print-all-qr-btn"
            >
              <HiOutlinePrinter />
              Print All QR
            </button>
          )}
          <button
            className="btn btn--primary"
            onClick={() => setShowAddModal(true)}
            id="add-table-btn"
          >
            <HiOutlinePlus />
            Add Table
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <div className="placeholder-empty-state">
          <div className="empty-state-icon-wrap">
            <HiOutlineQrcode className="empty-state-icon" />
          </div>
          <h2 className="empty-state-title">No Tables Yet</h2>
          <p className="empty-state-desc">
            Add your first table to generate QR codes for your customers.
          </p>
          <button
            className="btn btn--primary"
            onClick={() => setShowAddModal(true)}
            style={{ marginTop: '20px' }}
          >
            <HiOutlinePlus />
            Add Your First Table
          </button>
        </div>
      ) : (
        <div className="tables-grid">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`table-card ${selectedTable?.id === table.id ? 'table-card--selected' : ''}`}
              onClick={() => setSelectedTable(selectedTable?.id === table.id ? null : table)}
            >
              <div className="table-card-header">
                <span className="table-card-number">#{table.table_number}</span>
                <span className={`table-card-status ${table.current_session_id ? 'table-card-status--active' : ''}`}>
                  {table.current_session_id ? 'In Use' : 'Available'}
                </span>
              </div>

              <div className="table-card-qr">
                <QRCodeSVG
                  value={getQRUrl(table.id)}
                  size={120}
                  bgColor="transparent"
                  fgColor="#f0f1f5"
                  level="M"
                />
              </div>

              <div className="table-card-footer">
                <span className="table-card-id" title={table.id}>
                  ID: {table.id.substring(0, 8)}…
                </span>
                <button
                  className="table-card-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete({ id: table.id, table_number: table.table_number });
                  }}
                  disabled={deletingId === table.id}
                  title="Delete table"
                  id={`delete-table-${table.id}`}
                >
                  {deletingId === table.id ? (
                    <span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  ) : (
                    <HiOutlineTrash />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Detail Panel (selected table) */}
      {selectedTable && (
        <div className="qr-detail-panel">
          <div className="qr-detail-card">
            <h3 className="qr-detail-title">Table #{selectedTable.table_number} — QR Code</h3>
            <div className="qr-detail-code">
              <QRCodeSVG
                value={getQRUrl(selectedTable.id)}
                size={200}
                bgColor="#ffffff"
                fgColor="#0c0e14"
                level="H"
                includeMargin
              />
            </div>
            <p className="qr-detail-url">{getQRUrl(selectedTable.id)}</p>
            <button
              className="btn btn--secondary"
              onClick={() => {
                navigator.clipboard.writeText(getQRUrl(selectedTable.id));
                alert('URL copied to clipboard!');
              }}
            >
              Copy URL
            </button>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !adding && setShowAddModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add New Table</h2>
              <button
                className="modal-close"
                onClick={() => !adding && setShowAddModal(false)}
                aria-label="Close"
              >
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleAddTable} className="modal-body">
              <div className="login-field">
                <label htmlFor="table-number-input" className="login-label">Table Number</label>
                <div className="login-input-wrap">
                  <HiOutlineQrcode className="login-input-icon" />
                  <input
                    id="table-number-input"
                    type="number"
                    min="1"
                    className="login-input"
                    placeholder="e.g. 5"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setShowAddModal(false)}
                  disabled={adding}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={adding}
                  id="confirm-add-table-btn"
                >
                  {adding ? (
                    <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  ) : (
                    <>
                      <HiOutlinePlus />
                      Create Table
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => !deletingId && setConfirmDelete(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Confirm Deletion</h2>
              <button
                className="modal-close"
                onClick={() => !deletingId && setConfirmDelete(null)}
                aria-label="Close"
              >
                <HiOutlineX />
              </button>
            </div>
            <div className="modal-body">
              <div className="confirm-delete-content">
                <div className="confirm-delete-icon-wrap">
                  <HiOutlineExclamation className="confirm-delete-icon" />
                </div>
                <p className="confirm-delete-text">
                  Are you sure you want to delete <strong>Table #{confirmDelete.table_number}</strong>?
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setConfirmDelete(null)}
                  disabled={deletingId === confirmDelete.id}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={executeDeleteTable}
                  disabled={deletingId === confirmDelete.id}
                  id="confirm-delete-btn"
                >
                  {deletingId === confirmDelete.id ? (
                    <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  ) : (
                    <>
                      <HiOutlineTrash />
                      Delete Table
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
