import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { io } from "socket.io-client";
import ChangePasswordModal from "../pages/authentication/ChangePasswordModal";
import profileService from "../services/profile.service";
import notificationAPI from "../services/notification.service";
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

  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

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

  // Notifications API Fetch Helper
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationAPI.getNotifications();
      if (res.data?.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  // Listen to clicks outside the notifications dropdown and profile dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Socket Connection and fetching of initial list
  useEffect(() => {
    if (!user) return;

    const roleName = user?.roleId?.name || user?.role || "";
    const isOwner = roleName.toLowerCase() === "owner";
    if (!isOwner) return;

    // Fetch initial list
    fetchNotifications();

    // Socket initialization
    const socketUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true
    });

    socket.on("connect", () => {
      console.log("[Socket] Connected to server in Topbar");
      // Register socket to room
      const userId = user._id || user.id;
      if (userId) {
        socket.emit("register", userId);
      }
    });

    socket.on("new_notification", (newNotif) => {
      console.log("[Socket] Received new notification:", newNotif);
      setNotifications((prev) => [newNotif, ...prev]);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected from server");
    });

    return () => {
      socket.disconnect();
    };
  }, [user, fetchNotifications]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setDropOpen(false);
    navigate("/login", { replace: true });
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await notificationAPI.markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
      }
      setNotifOpen(false);

      // Check type and navigate
      if (notif.type === "refund_request" && notif.relatedId) {
        navigate(`/booking/${notif.relatedId}`);
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
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

      <div className="topbar-right" style={{ display: "flex", alignItems: "center" }}>
        {/* Bell Icon Notification Dropdown */}
        {user && (user?.roleId?.name || user?.role || "").toLowerCase() === "owner" && (
          <div className="tb-notifications" ref={notifRef} style={{ position: "relative", marginRight: "16px" }}>
            <button
              onClick={() => setNotifOpen((v) => !v)}
              style={{
                background: "none",
                border: "none",
                fontSize: "20px",
                color: "var(--text-muted)",
                cursor: "pointer",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px",
                borderRadius: "50%",
                transition: "background 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}
            >
              <i className="ti ti-bell" />
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    background: "#ef4444",
                    color: "#ffffff",
                    borderRadius: "50%",
                    fontSize: "10px",
                    fontWeight: 700,
                    width: "18px",
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {notifications.filter((n) => !n.isRead).length}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 10px)",
                  right: "-80px",
                  background: "#ffffff",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  boxShadow: "0 8px 32px rgba(16,42,67,.12)",
                  width: "320px",
                  zIndex: 200,
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border-light)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-dark)" }}>
                    Thông báo
                  </div>
                  {notifications.filter((n) => !n.isRead).length > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "11px",
                        color: "#0f766e",
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: 0
                      }}
                    >
                      Đọc tất cả
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                      Không có thông báo nào.
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const timeStr = new Date(n.createdAt).toLocaleDateString("vi-VN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit"
                      });

                      return (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #f1f5f9",
                            cursor: "pointer",
                            background: n.isRead ? "transparent" : "#f0fdfa",
                            transition: "background 0.2s",
                            display: "flex",
                            gap: "8px",
                            alignItems: "flex-start"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = n.isRead ? "#f8fafc" : "#ecfdf5"}
                          onMouseLeave={(e) => e.currentTarget.style.background = n.isRead ? "transparent" : "#f0fdfa"}
                        >
                          <div style={{ marginTop: "3px" }}>
                            <i
                              className="ti ti-mail"
                              style={{
                                fontSize: "16px",
                                color: n.isRead ? "#94a3b8" : "#0d9488"
                              }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: n.isRead ? 600 : 800,
                                color: "#1e293b",
                                marginBottom: "2px"
                              }}
                            >
                              {n.title}
                            </div>
                            <div style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.4", marginBottom: "4px" }}>
                              {n.message}
                            </div>
                            <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                              {timeStr}
                            </div>
                          </div>
                          {!n.isRead && (
                            <span
                              style={{
                                width: "6px",
                                height: "6px",
                                background: "#0d9488",
                                borderRadius: "50%",
                                marginTop: "6px"
                              }}
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}

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
