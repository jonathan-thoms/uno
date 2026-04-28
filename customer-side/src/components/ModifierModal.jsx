import { useState } from 'react';

/**
 * ModifierModal — Bottom sheet modal for item customization.
 * Renders actual modifier_groups from the item data,
 * lets user select options, and confirms with total price.
 */
export default function ModifierModal({ item, onClose, onConfirm, loading }) {
  // Track selected modifiers: { [groupIndex]: [optionIndex, ...] }
  const [selected, setSelected] = useState({});

  if (!item) return null;

  const groups = item.modifier_groups || [];

  function toggleOption(groupIdx, optIdx) {
    setSelected((prev) => {
      const current = prev[groupIdx] || [];
      const isSelected = current.includes(optIdx);

      if (isSelected) {
        return { ...prev, [groupIdx]: current.filter((i) => i !== optIdx) };
      } else {
        return { ...prev, [groupIdx]: [...current, optIdx] };
      }
    });
  }

  function isOptionSelected(groupIdx, optIdx) {
    return (selected[groupIdx] || []).includes(optIdx);
  }

  // Build the modifiers array for the cart item
  function getSelectedModifiers() {
    const modifiers = [];
    groups.forEach((group, gIdx) => {
      (selected[gIdx] || []).forEach((oIdx) => {
        const opt = group.options[oIdx];
        if (opt) {
          modifiers.push({
            group: group.name,
            label: opt.label,
            price: Number(opt.price) || 0,
          });
        }
      });
    });
    return modifiers;
  }

  // Calculate total with modifiers
  const modifierTotal = getSelectedModifiers().reduce((sum, m) => sum + m.price, 0);
  const totalPrice = (item.price || 0) + modifierTotal;

  function handleConfirm() {
    if (!loading) {
      onConfirm(getSelectedModifiers());
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-sheet__header">
          <div>
            <div className="modal-sheet__title">{item.name}</div>
            <div className="modal-sheet__price">₹{item.price}</div>
          </div>
          <button className="modal-sheet__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Modifier Groups */}
        <div className="modal-sheet__body">
          {groups.length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>
              No customization options available.
            </p>
          ) : (
            groups.map((group, gIdx) => (
              <div key={gIdx} className="mod-group">
                <div className="mod-group__header">
                  <span className="mod-group__name">{group.name}</span>
                  {group.rules && <span className="mod-group__rule">{group.rules}</span>}
                </div>
                {(group.options || []).map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    className={`mod-option ${isOptionSelected(gIdx, oIdx) ? 'mod-option--selected' : ''}`}
                    onClick={() => toggleOption(gIdx, oIdx)}
                  >
                    <div className="mod-option__check">✓</div>
                    <span className="mod-option__label">{opt.label}</span>
                    {Number(opt.price) > 0 && (
                      <span className="mod-option__price">+₹{opt.price}</span>
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="modal-sheet__footer">
          <button
            className="btn btn--primary btn--full btn--lg"
            onClick={handleConfirm}
            disabled={loading}
            id="confirm-add-btn"
          >
            {loading ? (
              <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            ) : (
              <>Add to Cart — ₹{totalPrice}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
