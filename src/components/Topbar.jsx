import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import ChangePasswordModal from "../pages/authentication/ChangePasswordModal";
import profileService from "../services/profile.service";
import "../pages/dashboard/Dashboard.css";

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

export default function Topbar({ breadcrumbs = [], user: propUser }) {
  const [user, setUser] = useState(propUser || null);
  const [dropOpen, setDropOpen] = useState(false);
  const [cpModalOpen, setCpModalOpen] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();

  // If propUser changes, sync state
  useEffect(() => {
    if (propUser) {
      setUser(propUser);
    }
  }, [propUser]);

  // Fetch user if not passed as prop
  useEffect(() => {
    if (propUser) return;

    const token = localStorage.getItem("token");
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setUser(decoded);
      }
      
      // Fetch fresh profile details from API
      profileService.getProfile()
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setUser(res.data.data);
          } else if (res.data) {
            setUser(res.data);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch fresh profile in Topbar:", err);
        });
    }
  }, [propUser]);

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

  // Determine user display name and role
  const displayName = user?.fullName || user?.email || "";
  const roleName = user?.roleId?.name || user?.role || "";
  const initials = getInitials(displayName);

  return (
    <div className="topbar">
      <div className="topbar-left">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          if (isLast) {
            return (
              <span key={idx} className="breadcrumb-active">
                {crumb.label}
              </span>
            );
          }
          return (
            <span key={idx}>
              {crumb.link ? (
                <Link to={crumb.link} className="breadcrumb-link" style={{ textDecoration: "none", color: "var(--text-muted)" }}>
                  {crumb.label}
                </Link>
              ) : (
                <span className="breadcrumb">{crumb.label}</span>
              )}
              <span className="breadcrumb-separator" style={{ margin: "0 8px", color: "var(--text-muted)" }}>/</span>
            </span>
          );
        })}
      </div>

      <div className="topbar-right">
        {user ? (
          <div
            className="tb-user"
            ref={dropRef}
            style={{ position: "relative" }}
            onClick={() => setDropOpen((v) => !v)}
          >
            <div className="tb-avatar">{initials}</div>
            <div>
              <div className="tb-uname">{displayName}</div>
              <div className="tb-role" style={{ textTransform: "capitalize" }}>{roleName}</div>
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
                    {displayName}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, textTransform: "capitalize" }}>
                    {roleName}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setDropOpen(false);
                    navigate("/profile");
                  }}
                  style={{
                    width: "100%", padding: "11px 16px",
                    background: "none", border: "none",
                    display: "flex", alignItems: "center", gap: 8,
                    fontSize: 13, fontWeight: 700, color: "var(--text-dark)",
                    cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                >
                  <i className="ti ti-user" style={{ fontSize: 16 }} />
                  Trang cá nhân
                </button>
                <button
                  onClick={() => {
                    setDropOpen(false);
                    setCpModalOpen(true);
                  }}
                  style={{
                    width: "100%", padding: "11px 16px",
                    background: "none", border: "none",
                    display: "flex", alignItems: "center", gap: 8,
                    fontSize: 13, fontWeight: 700, color: "var(--text-dark)",
                    cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                >
                  <i className="ti ti-key" style={{ fontSize: 16 }} />
                  Đổi mật khẩu
                </button>
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
          <button className="btn-outline" onClick={() => navigate("/login")}>
            Đăng nhập
          </button>
        )}
      </div>

      <ChangePasswordModal isOpen={cpModalOpen} onClose={() => setCpModalOpen(false)} />
    </div>
  );
}
