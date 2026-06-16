import React from 'react';

export default function Sidebar({ menuItems, active, setActive, handleLogout, onLogoClick }) {
  return (
    <aside className="sb">
      <div className="sb-brand">
        <div className="auth-brand__logo" style={{ color: "#ffffff", cursor: "pointer" }} onClick={onLogoClick}>
          <img src="/logo.png" alt="Logo" className="auth-brand__logo-icon" />
          C-CBMS
        </div>
      </div>

      {menuItems.map((group) => (
        <div key={group.section}>
          <div className="sb-section">{group.section}</div>
          {group.items.map((item) => (
            <div
              key={item.key}
              className={`sb-item${item.child ? " sb-child" : ""}${active === item.key ? " active" : ""}`}
              onClick={() => setActive(item.key)}
            >
              <i className={`ti ${item.icon}`} aria-hidden="true" />
              {item.label}
              {item.badge && <span className="sb-badge">{item.badge}</span>}
            </div>
          ))}
        </div>
      ))}

      <div className="sb-footer">
        <div className="sb-logout" onClick={handleLogout}>
          <i className="ti ti-logout" aria-hidden="true" />
          Đăng xuất
        </div>
      </div>
    </aside>
  );
}
