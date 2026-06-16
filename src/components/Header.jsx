import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function decodeToken(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

export default function Header() {
  const [user, setUser] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
      } else {
        localStorage.removeItem("token");
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setDropOpen(false);
    navigate("/login", { replace: true });
  };

  const initials = getInitials(user?.fullName || user?.email || "");

  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="nav-brand">
          <div className="auth-brand__logo" style={{ cursor: "pointer" }} onClick={() => navigate("/landing-dashboard")}>
            <img src="/logo.png" alt="Logo" className="auth-brand__logo-icon" />
            C-CBMS
          </div>
        </div>

        <div className="nav-links">
          <a href="#" className="nav-link active">Trang chủ</a>
          <a href="#" className="nav-link">Phòng &amp; Tiện ích</a>
          <a href="#" className="nav-link">Dịch vụ</a>
          <a href="#" className="nav-link">Bảng giá</a>
          <a href="#" className="nav-link">Hướng dẫn</a>
        </div>

        <div className="nav-auth">
          {user ? (
            <div
              className="tb-user"
              ref={dropRef}
              style={{ position: "relative" }}
              onClick={() => setDropOpen((v) => !v)}
            >
              <div className="tb-avatar">{initials}</div>
              <div>
                <div className="tb-uname">{user.fullName || user.email}</div>
                <div className="tb-role" style={{ textTransform: "capitalize" }}>{user.role}</div>
              </div>
              <i
                className="ti ti-chevron-down"
                style={{ fontSize: 14, color: "var(--text-muted)", marginLeft: 4 }}
              />

              {dropOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 10px)", right: 0,
                  background: "#fff", border: "1px solid var(--border)",
                  borderRadius: 12, boxShadow: "0 8px 32px rgba(16,42,67,.12)",
                  minWidth: 180, zIndex: 200, overflow: "hidden",
                }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-light)" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-dark)" }}>
                      {user.fullName || user.email}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, textTransform: "capitalize" }}>
                      {user.role}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%", padding: "11px 16px",
                      background: "none", border: "none",
                      display: "flex", alignItems: "center", gap: 8,
                      fontSize: 13, fontWeight: 700, color: "#b42318",
                      cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#fff1f0"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    <i className="ti ti-logout" style={{ fontSize: 16 }} />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button className="btn-outline" onClick={() => navigate("/login")}>
                Đăng nhập
              </button>
              <button className="btn-primary" onClick={() => navigate("/register")}>
                Đăng ký
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
