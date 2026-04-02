import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';
import { RESTAURANT_ID } from '../constants';
import {
  HiOutlineBookOpen,
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineTag,
  HiOutlineCheck,
  HiOutlineCurrencyRupee,
  HiOutlineExclamation,
} from 'react-icons/hi';

export default function MenuManagementPage() {
  // State
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  // Category modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null); // null = add, string = edit
  const [catName, setCatName] = useState('');
  const [catSaving, setCatSaving] = useState(false);

  // Item modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = add, object = edit
  const [itemForm, setItemForm] = useState({
    name: '',
    price: '',
    category: '',
    is_available: true,
    modifier_groups: [],
  });
  const [itemSaving, setItemSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Delete confirmation state
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null); // item obj or null
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null); // category string or null

  // Refs for Firestore paths
  const restaurantRef = doc(db, 'restaurants', RESTAURANT_ID);
  const menuItemsRef = collection(db, 'restaurants', RESTAURANT_ID, 'menu_items');

  // ─── Load categories from restaurant settings ───
  useEffect(() => {
    const unsubscribe = onSnapshot(restaurantRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCategories(data.settings?.categories || []);
      } else {
        // Create the restaurant document if it doesn't exist
        setDoc(restaurantRef, {
          name: 'UNO Restaurant',
          settings: { categories: [], currency: '₹', tax_rate: 0 },
        }, { merge: true });
      }
    });
    return unsubscribe;
  }, []);

  // ─── Load menu items ───
  useEffect(() => {
    const q = query(menuItemsRef, orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMenuItems(items);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // ─── Category CRUD ───
  async function handleSaveCategory(e) {
    e.preventDefault();
    const trimmed = catName.trim();
    if (!trimmed) return;

    setCatSaving(true);
    try {
      let updated;
      if (editingCat !== null) {
        // Editing: replace old name with new in array, also update items
        updated = categories.map((c) => (c === editingCat ? trimmed : c));
        // Update all menu items that had the old category name
        const itemsToUpdate = menuItems.filter((i) => i.category === editingCat);
        for (const item of itemsToUpdate) {
          await updateDoc(doc(db, 'restaurants', RESTAURANT_ID, 'menu_items', item.id), {
            category: trimmed,
          });
        }
      } else {
        // Adding: check for duplicate
        if (categories.includes(trimmed)) {
          alert(`Category "${trimmed}" already exists.`);
          setCatSaving(false);
          return;
        }
        updated = [...categories, trimmed];
      }

      await updateDoc(restaurantRef, { 'settings.categories': updated });
      setShowCatModal(false);
      setCatName('');
      setEditingCat(null);
    } catch (err) {
      console.error('Error saving category:', err);
      alert('Failed to save category.');
    } finally {
      setCatSaving(false);
    }
  }

  function handleDeleteCategory(cat) {
    const itemsInCat = menuItems.filter((i) => i.category === cat);
    if (itemsInCat.length > 0) {
      alert(`Cannot delete "${cat}" — it has ${itemsInCat.length} item(s). Remove or reassign items first.`);
      return;
    }
    setConfirmDeleteCat(cat);
  }

  async function executeDeleteCategory() {
    if (!confirmDeleteCat) return;
    try {
      const updated = categories.filter((c) => c !== confirmDeleteCat);
      await updateDoc(restaurantRef, { 'settings.categories': updated });
      if (activeCategory === confirmDeleteCat) setActiveCategory('all');
    } catch (err) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category.');
    } finally {
      setConfirmDeleteCat(null);
    }
  }

  function openEditCategory(cat) {
    setEditingCat(cat);
    setCatName(cat);
    setShowCatModal(true);
  }

  function openAddCategory() {
    setEditingCat(null);
    setCatName('');
    setShowCatModal(true);
  }

  // ─── Menu Item CRUD ───
  function openAddItem() {
    setEditingItem(null);
    setItemForm({
      name: '',
      price: '',
      category: activeCategory !== 'all' ? activeCategory : (categories[0] || ''),
      is_available: true,
      modifier_groups: [],
    });
    setShowItemModal(true);
  }

  function openEditItem(item) {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      price: String(item.price),
      category: item.category,
      is_available: item.is_available,
      modifier_groups: item.modifier_groups || [],
    });
    setShowItemModal(true);
  }

  async function handleSaveItem(e) {
    e.preventDefault();
    const { name, price, category, is_available, modifier_groups } = itemForm;

    if (!name.trim() || !price || !category) {
      alert('Please fill in Name, Price, and Category.');
      return;
    }

    // Validate modifier_groups structure
    const validatedModifiers = modifier_groups.map((mg) => ({
      name: mg.name || '',
      options: (mg.options || []).map((opt) => ({
        label: opt.label || '',
        price: Number(opt.price) || 0,
      })),
      rules: mg.rules || '',
    }));

    const itemData = {
      name: name.trim(),
      price: Number(price),
      category,
      is_available,
      modifier_groups: validatedModifiers,
    };

    setItemSaving(true);
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'restaurants', RESTAURANT_ID, 'menu_items', editingItem.id), itemData);
      } else {
        itemData.created_at = serverTimestamp();
        await addDoc(menuItemsRef, itemData);
      }
      setShowItemModal(false);
    } catch (err) {
      console.error('Error saving item:', err);
      alert('Failed to save item.');
    } finally {
      setItemSaving(false);
    }
  }

  async function executeDeleteItem() {
    if (!confirmDeleteItem) return;
    setDeletingId(confirmDeleteItem.id);
    try {
      await deleteDoc(doc(db, 'restaurants', RESTAURANT_ID, 'menu_items', confirmDeleteItem.id));
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item. Check Firestore rules or try again.');
    } finally {
      setDeletingId(null);
      setConfirmDeleteItem(null);
    }
  }

  async function handleToggleAvailability(item) {
    await updateDoc(doc(db, 'restaurants', RESTAURANT_ID, 'menu_items', item.id), {
      is_available: !item.is_available,
    });
  }

  // ─── Modifier Group helpers ───
  function addModifierGroup() {
    setItemForm((prev) => ({
      ...prev,
      modifier_groups: [
        ...prev.modifier_groups,
        { name: '', options: [{ label: '', price: 0 }], rules: '' },
      ],
    }));
  }

  function removeModifierGroup(idx) {
    setItemForm((prev) => ({
      ...prev,
      modifier_groups: prev.modifier_groups.filter((_, i) => i !== idx),
    }));
  }

  function updateModifierGroup(idx, field, value) {
    setItemForm((prev) => ({
      ...prev,
      modifier_groups: prev.modifier_groups.map((mg, i) =>
        i === idx ? { ...mg, [field]: value } : mg
      ),
    }));
  }

  function addModifierOption(groupIdx) {
    setItemForm((prev) => ({
      ...prev,
      modifier_groups: prev.modifier_groups.map((mg, i) =>
        i === groupIdx
          ? { ...mg, options: [...mg.options, { label: '', price: 0 }] }
          : mg
      ),
    }));
  }

  function removeModifierOption(groupIdx, optIdx) {
    setItemForm((prev) => ({
      ...prev,
      modifier_groups: prev.modifier_groups.map((mg, i) =>
        i === groupIdx
          ? { ...mg, options: mg.options.filter((_, j) => j !== optIdx) }
          : mg
      ),
    }));
  }

  function updateModifierOption(groupIdx, optIdx, field, value) {
    setItemForm((prev) => ({
      ...prev,
      modifier_groups: prev.modifier_groups.map((mg, i) =>
        i === groupIdx
          ? {
              ...mg,
              options: mg.options.map((opt, j) =>
                j === optIdx ? { ...opt, [field]: value } : opt
              ),
            }
          : mg
      ),
    }));
  }

  // ─── Filtered items ───
  const filteredItems = activeCategory === 'all'
    ? menuItems
    : menuItems.filter((i) => i.category === activeCategory);

  if (loading) {
    return (
      <div className="page-placeholder-container">
        <div className="page-header">
          <h1 className="page-title">Menu Management</h1>
        </div>
        <div className="loading-screen" style={{ height: '40vh' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="menu-mgmt">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Menu Management</h1>
          <p className="page-subtitle">
            {menuItems.length} item{menuItems.length !== 1 ? 's' : ''} across {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <button className="btn btn--primary" onClick={openAddItem} id="add-menu-item-btn">
          <HiOutlinePlus />
          Add Item
        </button>
      </div>

      {/* ── Category Tabs ── */}
      <div className="category-bar">
        <div className="category-tabs">
          <button
            className={`category-tab ${activeCategory === 'all' ? 'category-tab--active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Items
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-tab ${activeCategory === cat ? 'category-tab--active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
              <span className="category-tab-count">
                {menuItems.filter((i) => i.category === cat).length}
              </span>
            </button>
          ))}
        </div>
        <button className="btn btn--ghost category-manage-btn" onClick={openAddCategory} title="Add category">
          <HiOutlinePlus />
          Category
        </button>
      </div>

      {/* ── Category Pills (editable) ── */}
      {categories.length > 0 && (
        <div className="category-chips">
          {categories.map((cat) => (
            <div key={cat} className="category-chip">
              <HiOutlineTag className="category-chip-icon" />
              <span>{cat}</span>
              <button
                className="category-chip-action"
                onClick={() => openEditCategory(cat)}
                title="Edit"
              >
                <HiOutlinePencil />
              </button>
              <button
                className="category-chip-action category-chip-action--delete"
                onClick={() => handleDeleteCategory(cat)}
                title="Delete"
              >
                <HiOutlineX />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Menu Items Grid ── */}
      {filteredItems.length === 0 ? (
        <div className="placeholder-empty-state" style={{ padding: '60px 24px' }}>
          <div className="empty-state-icon-wrap">
            <HiOutlineBookOpen className="empty-state-icon" />
          </div>
          <h2 className="empty-state-title">
            {categories.length === 0 ? 'Add a Category First' : 'No Items Yet'}
          </h2>
          <p className="empty-state-desc">
            {categories.length === 0
              ? 'Create at least one category, then start adding menu items.'
              : 'Click "Add Item" to create your first menu item in this category.'}
          </p>
        </div>
      ) : (
        <div className="menu-items-grid">
          {filteredItems.map((item) => (
            <div key={item.id} className={`menu-item-card ${!item.is_available ? 'menu-item-card--unavailable' : ''}`}>
              <div className="menu-item-header">
                <div className="menu-item-info">
                  <h3 className="menu-item-name">{item.name}</h3>
                  <span className="menu-item-category">{item.category}</span>
                </div>
                <span className="menu-item-price">₹{item.price}</span>
              </div>

              {item.modifier_groups && item.modifier_groups.length > 0 && (
                <div className="menu-item-modifiers">
                  {item.modifier_groups.map((mg, i) => (
                    <span key={i} className="modifier-badge">
                      {mg.name} ({mg.options?.length || 0})
                    </span>
                  ))}
                </div>
              )}

              <div className="menu-item-footer">
                <button
                  className={`availability-toggle ${item.is_available ? 'availability-toggle--on' : ''}`}
                  onClick={() => handleToggleAvailability(item)}
                  title={item.is_available ? 'Mark unavailable' : 'Mark available'}
                >
                  <div className="availability-toggle-thumb" />
                  <span className="availability-toggle-label">
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </button>

                <div className="menu-item-actions">
                  <button
                    className="menu-item-action-btn"
                    onClick={() => openEditItem(item)}
                    title="Edit"
                  >
                    <HiOutlinePencil />
                  </button>
                  <button
                    className="menu-item-action-btn menu-item-action-btn--delete"
                    onClick={() => setConfirmDeleteItem(item)}
                    disabled={deletingId === item.id}
                    title="Delete"
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Category Modal ── */}
      {showCatModal && (
        <div className="modal-overlay" onClick={() => !catSaving && setShowCatModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingCat !== null ? 'Edit Category' : 'Add Category'}</h2>
              <button className="modal-close" onClick={() => !catSaving && setShowCatModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="modal-body">
              <div className="login-field">
                <label htmlFor="cat-name-input" className="login-label">Category Name</label>
                <div className="login-input-wrap">
                  <HiOutlineTag className="login-input-icon" />
                  <input
                    id="cat-name-input"
                    type="text"
                    className="login-input"
                    placeholder="e.g. Starters"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setShowCatModal(false)} disabled={catSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={catSaving}>
                  {catSaving ? <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : (
                    <><HiOutlineCheck /> {editingCat !== null ? 'Update' : 'Create'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Item Modal ── */}
      {showItemModal && (
        <div className="modal-overlay" onClick={() => !itemSaving && setShowItemModal(false)}>
          <div className="modal-card modal-card--wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingItem ? 'Edit Item' : 'Add Menu Item'}</h2>
              <button className="modal-close" onClick={() => !itemSaving && setShowItemModal(false)}>
                <HiOutlineX />
              </button>
            </div>
            <form onSubmit={handleSaveItem} className="modal-body modal-body--scrollable">
              {/* Basic info */}
              <div className="form-row">
                <div className="login-field" style={{ flex: 2 }}>
                  <label htmlFor="item-name" className="login-label">Item Name</label>
                  <div className="login-input-wrap">
                    <input
                      id="item-name"
                      type="text"
                      className="login-input"
                      placeholder="e.g. Margherita Pizza"
                      value={itemForm.name}
                      onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                <div className="login-field" style={{ flex: 1 }}>
                  <label htmlFor="item-price" className="login-label">Price (₹)</label>
                  <div className="login-input-wrap">
                    <HiOutlineCurrencyRupee className="login-input-icon" />
                    <input
                      id="item-price"
                      type="number"
                      min="0"
                      step="1"
                      className="login-input"
                      placeholder="299"
                      value={itemForm.price}
                      onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="login-field" style={{ flex: 1 }}>
                  <label htmlFor="item-category" className="login-label">Category</label>
                  <div className="login-input-wrap">
                    <HiOutlineTag className="login-input-icon" />
                    <select
                      id="item-category"
                      className="login-input form-select"
                      value={itemForm.category}
                      onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                      required
                    >
                      <option value="">Select category...</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="login-field" style={{ flex: 0 }}>
                  <label className="login-label">Available</label>
                  <button
                    type="button"
                    className={`availability-toggle ${itemForm.is_available ? 'availability-toggle--on' : ''}`}
                    onClick={() => setItemForm({ ...itemForm, is_available: !itemForm.is_available })}
                    style={{ marginTop: '4px' }}
                  >
                    <div className="availability-toggle-thumb" />
                  </button>
                </div>
              </div>

              {/* ── Modifier Groups Section ── */}
              <div className="modifier-section">
                <div className="modifier-section-header">
                  <h3 className="modifier-section-title">Modifier Groups</h3>
                  <button type="button" className="btn btn--ghost" onClick={addModifierGroup}>
                    <HiOutlinePlus /> Add Group
                  </button>
                </div>

                {itemForm.modifier_groups.length === 0 && (
                  <p className="modifier-empty-text">
                    No modifier groups. Add groups like "Add-ons" or "Size" to let customers customize this item.
                  </p>
                )}

                {itemForm.modifier_groups.map((mg, gIdx) => (
                  <div key={gIdx} className="modifier-group-card">
                    <div className="modifier-group-header">
                      <div className="form-row" style={{ flex: 1, gap: '10px' }}>
                        <div className="login-field" style={{ flex: 2 }}>
                          <label className="login-label">Group Name</label>
                          <div className="login-input-wrap login-input-wrap--sm">
                            <input
                              type="text"
                              className="login-input"
                              placeholder="e.g. Add-ons"
                              value={mg.name}
                              onChange={(e) => updateModifierGroup(gIdx, 'name', e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="login-field" style={{ flex: 1 }}>
                          <label className="login-label">Rules</label>
                          <div className="login-input-wrap login-input-wrap--sm">
                            <input
                              type="text"
                              className="login-input"
                              placeholder="e.g. Select up to 2"
                              value={mg.rules}
                              onChange={(e) => updateModifierGroup(gIdx, 'rules', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="modifier-group-remove"
                        onClick={() => removeModifierGroup(gIdx)}
                        title="Remove group"
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>

                    {/* Options within this modifier group */}
                    <div className="modifier-options">
                      {mg.options.map((opt, oIdx) => (
                        <div key={oIdx} className="modifier-option-row">
                          <input
                            type="text"
                            className="modifier-option-input modifier-option-input--label"
                            placeholder="Option name (e.g. Extra Cheese)"
                            value={opt.label}
                            onChange={(e) => updateModifierOption(gIdx, oIdx, 'label', e.target.value)}
                          />
                          <div className="modifier-option-price-wrap">
                            <span className="modifier-option-currency">₹</span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              className="modifier-option-input modifier-option-input--price"
                              placeholder="50"
                              value={opt.price}
                              onChange={(e) => updateModifierOption(gIdx, oIdx, 'price', e.target.value)}
                            />
                          </div>
                          <button
                            type="button"
                            className="modifier-option-remove"
                            onClick={() => removeModifierOption(gIdx, oIdx)}
                            title="Remove option"
                          >
                            <HiOutlineX />
                          </button>
                        </div>
                      ))}
                      <button type="button" className="modifier-add-option" onClick={() => addModifierOption(gIdx)}>
                        <HiOutlinePlus /> Add Option
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setShowItemModal(false)} disabled={itemSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={itemSaving} id="save-menu-item-btn">
                  {itemSaving ? <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : (
                    <><HiOutlineCheck /> {editingItem ? 'Update Item' : 'Create Item'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Item Confirmation Modal ── */}
      {confirmDeleteItem && (
        <div className="modal-overlay" onClick={() => !deletingId && setConfirmDeleteItem(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Confirm Deletion</h2>
              <button className="modal-close" onClick={() => !deletingId && setConfirmDeleteItem(null)}>
                <HiOutlineX />
              </button>
            </div>
            <div className="modal-body">
              <div className="confirm-delete-content">
                <div className="confirm-delete-icon-wrap">
                  <HiOutlineExclamation className="confirm-delete-icon" />
                </div>
                <p className="confirm-delete-text">
                  Are you sure you want to delete <strong>"{confirmDeleteItem.name}"</strong>?
                  This action cannot be undone.
                </p>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setConfirmDeleteItem(null)}
                  disabled={deletingId === confirmDeleteItem.id}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={executeDeleteItem}
                  disabled={deletingId === confirmDeleteItem.id}
                  id="confirm-delete-item-btn"
                >
                  {deletingId === confirmDeleteItem.id ? (
                    <span className="loading-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  ) : (
                    <><HiOutlineTrash /> Delete Item</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Category Confirmation Modal ── */}
      {confirmDeleteCat && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteCat(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Category</h2>
              <button className="modal-close" onClick={() => setConfirmDeleteCat(null)}>
                <HiOutlineX />
              </button>
            </div>
            <div className="modal-body">
              <div className="confirm-delete-content">
                <div className="confirm-delete-icon-wrap">
                  <HiOutlineExclamation className="confirm-delete-icon" />
                </div>
                <p className="confirm-delete-text">
                  Are you sure you want to delete category <strong>"{confirmDeleteCat}"</strong>?
                </p>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setConfirmDeleteCat(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={executeDeleteCategory}
                  id="confirm-delete-cat-btn"
                >
                  <HiOutlineTrash /> Delete Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
