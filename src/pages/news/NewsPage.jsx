import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import ChangePasswordModal from "../authentication/ChangePasswordModal";
import { ownerMenuItems } from "../dashboard/Owner";
import newsAPI from "../../services/news.service";
import "../dashboard/Dashboard.css";
import "./NewsPage.css";

const emptyForm = {
  title: "",
  content: "",
  image: "",
  isActive: true,
};

const fallbackNews = [
  {
    _id: "local-news-1",
    title: "C-CBMS khai trương khu phòng mới",
    content: "Hệ thống phòng mới được nâng cấp không gian, âm thanh và tiện ích.",
    image: "",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .slice(0, 2)
    .join("");
}

export default function NewsPage() {
  const navigate = useNavigate();
  const dropRef = useRef(null);
  const [user, setUser] = useState(null);
  const [dropOpen, setDropOpen] = useState(false);
  const [cpModalOpen, setCpModalOpen] = useState(false);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingNews, setEditingNews] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [apiOffline, setApiOffline] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const decoded = token ? decodeToken(token) : null;

    setUser(
      decoded && decoded.exp * 1000 > Date.now()
        ? decoded
        : { email: "owner@c-cbms.local", fullName: "Owner", role: "owner" }
    );
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropRef.current && !dropRef.current.contains(event.target)) {
        setDropOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await newsAPI.getAllNews();
      if (res.success) {
        setNews(res.data || []);
        setApiOffline(false);
      }
    } catch (error) {
      console.error("Fetch news failed", error);
      setApiOffline(true);
      setNews((prev) => (prev.length > 0 ? prev : fallbackNews));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setDropOpen(false);
    navigate("/login", { replace: true });
  };

  const handleMenuChange = (key) => {
    if (key === "news") return;
    if (key === "room") {
      navigate("/room");
      return;
    }
    navigate("/owner-dashboard");
  };

  const openCreateForm = () => {
    setEditingNews(null);
    setFormData(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingNews(item);
    setFormData({
      title: item.title || "",
      content: item.content || "",
      image: item.image || "",
      isActive: item.isActive !== false,
    });
    setShowForm(true);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingNews) {
        const res = await newsAPI.updateNews(editingNews._id, formData);
        if (!res.success) throw new Error(res.message || "Update news failed");
      } else {
        const res = await newsAPI.createNews(formData);
        if (!res.success) throw new Error(res.message || "Create news failed");
      }

      setShowForm(false);
      setEditingNews(null);
      await fetchNews();
    } catch (error) {
      console.error("Save news failed", error);
      setApiOffline(true);

      const localNews = {
        ...formData,
        _id: editingNews?._id || `local-news-${Date.now()}`,
        createdAt: editingNews?.createdAt || new Date().toISOString(),
      };

      setNews((prev) =>
        editingNews
          ? prev.map((item) => (item._id === editingNews._id ? localNews : item))
          : [localNews, ...prev]
      );
      setShowForm(false);
      setEditingNews(null);
    }
  };

  const handleDelete = async (item) => {
    const ok = window.confirm(`Xóa tin "${item.title}"?`);
    if (!ok) return;

    try {
      const res = await newsAPI.deleteNews(item._id);
      if (!res.success) throw new Error(res.message || "Delete news failed");
      await fetchNews();
    } catch (error) {
      console.error("Delete news failed", error);
      setApiOffline(true);
      setNews((prev) => prev.filter((newsItem) => newsItem._id !== item._id));
    }
  };

  const initials = getInitials(user?.fullName || user?.email || "");

  return (
    <div className="dash">
      <Sidebar
        menuItems={ownerMenuItems}
        active="news"
        setActive={handleMenuChange}
        handleLogout={handleLogout}
        onLogoClick={() => navigate("/owner-dashboard")}
      />

      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <span className="breadcrumb">Trang chủ&nbsp;/&nbsp;</span>
            <span className="breadcrumb-active">Quản lý tin tức</span>
          </div>
          <div className="topbar-right">
            <div className="tb-user" ref={dropRef} style={{ position: "relative" }} onClick={() => setDropOpen((v) => !v)}>
              <div className="tb-avatar">{initials}</div>
              <div>
                <div className="tb-uname">{user?.fullName || user?.email}</div>
                <div className="tb-role" style={{ textTransform: "capitalize" }}>{user?.role}</div>
              </div>
              <i className="ti ti-chevron-down" style={{ fontSize: 14, color: "var(--text-muted)", marginLeft: 4 }} />

              {dropOpen && (
                <div className="news-user-menu">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDropOpen(false);
                      setCpModalOpen(true);
                    }}
                  >
                    <i className="ti ti-key" />
                    Đổi mật khẩu
                  </button>
                  <button type="button" className="danger" onClick={handleLogout}>
                    <i className="ti ti-logout" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="content">
          <div className="news-page-head">
            <div>
              <div className="pg-title">Quản lý tin tức</div>
              <div className="pg-sub">Tin tức dùng chung cho toàn bộ chi nhánh.</div>
              {apiOffline && (
                <div className="news-offline-note">
                  Backend chưa phản hồi, trang đang dùng dữ liệu tạm trên trình duyệt.
                </div>
              )}
            </div>
            {!showForm && (
              <button className="btn-primary" onClick={openCreateForm}>
                <i className="ti ti-plus" /> Tạo tin tức
              </button>
            )}
          </div>

          {showForm && (
            <div className="card news-form-card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-news" aria-hidden="true" />
                  {editingNews ? "Cập nhật tin tức" : "Tạo tin tức"}
                </div>
              </div>
              <form className="news-form" onSubmit={handleSubmit}>
                <label>
                  Tiêu đề
                  <input name="title" value={formData.title} onChange={handleChange} required />
                </label>
                <label>
                  Nội dung
                  <textarea name="content" value={formData.content} onChange={handleChange} rows="6" required />
                </label>
                <label>
                  Ảnh
                  <input name="image" value={formData.image} onChange={handleChange} placeholder="URL ảnh" />
                </label>
                <label className="news-checkbox">
                  <input name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} />
                  Hiển thị tin tức
                </label>
                <div className="news-form-actions">
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingNews(null);
                    }}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingNews ? "Lưu thay đổi" : "Tạo tin tức"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {!showForm && (
            <div className="card">
              <div className="card-head">
                <div className="card-title">
                  <i className="ti ti-list" aria-hidden="true" />
                  Danh sách tin tức
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="dash-table news-table">
                  <thead>
                    <tr>
                      <th>Tiêu đề</th>
                      <th>Nội dung</th>
                      <th>Ngày tạo</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="news-empty">Đang tải danh sách tin tức...</td>
                      </tr>
                    ) : news.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="news-empty">Chưa có tin tức nào.</td>
                      </tr>
                    ) : (
                      news.map((item) => (
                        <tr key={item._id}>
                          <td>{item.title}</td>
                          <td className="news-content-cell">{item.content}</td>
                          <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "-"}</td>
                          <td>
                            <span className={`pill ${item.isActive ? "pill-on" : "pill-off"}`}>
                              {item.isActive ? "Đang hiển thị" : "Đã ẩn"}
                            </span>
                          </td>
                          <td>
                            <div className="news-actions">
                              <button type="button" onClick={() => openEditForm(item)}>
                                Sửa
                              </button>
                              <button type="button" className="danger" onClick={() => handleDelete(item)}>
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <ChangePasswordModal isOpen={cpModalOpen} onClose={() => setCpModalOpen(false)} />
    </div>
  );
}
