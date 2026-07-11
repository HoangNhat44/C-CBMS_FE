import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ menuItems, active, setActive, handleLogout, onLogoClick }) {
  const { hasPermission, loading } = useAuth();

  if (loading) return <aside className="sb"><div className="sb-brand">...</div></aside>;
  return (
    <aside className="sb">
      <div className="sb-brand">
        <div className="auth-brand__logo" style={{ color: "#ffffff", cursor: "pointer" }} onClick={onLogoClick}>
          <img src="/logo.png" alt="Logo" className="auth-brand__logo-icon" />
          C-CBMS
        </div>
      </div>

      {menuItems.map((group) => {
        const visibleItems = group.items.filter(item => {
          if (item.requiredPermission) {
            return hasPermission(item.requiredPermission);
          }
          return true;
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={group.section}>
            <div className="sb-section">{group.section}</div>
            {visibleItems.map((item) => (
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
        );
      })}

      <div className="sb-footer">
        <div className="sb-logout" onClick={handleLogout}>
          <i className="ti ti-logout" aria-hidden="true" />
          Đăng xuất
        </div>
      </div>
    </aside>
  );
}
