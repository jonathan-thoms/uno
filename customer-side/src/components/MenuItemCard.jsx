/**
 * MenuItemCard — Displays a single menu item with name, price,
 * modifier hint, and an add button.
 */
export default function MenuItemCard({ item, onAdd, disabled }) {
  const hasModifiers = item.modifier_groups && item.modifier_groups.length > 0;

  return (
    <div className={`menu-card ${!item.is_available ? 'menu-card--unavailable' : ''}`}>
      <div className="menu-card__body">
        <div className="menu-card__name">{item.name}</div>
        {item.description && (
          <div className="menu-card__desc">{item.description}</div>
        )}
        <div>
          <span className="menu-card__price">₹{item.price}</span>
          {hasModifiers && (
            <span className="menu-card__mods-hint">
              ✦ customizable
            </span>
          )}
        </div>
      </div>
      <button
        className="menu-card__add-btn"
        onClick={onAdd}
        disabled={disabled}
        aria-label={`Add ${item.name}`}
      >
        +
      </button>
    </div>
  );
}
