import { useState } from "react";
import authAPI from "../../services/auth.service";
import "./Auth.css";

export default function ChangePasswordModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const toggleShow = (field) => {
    setShowPw((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword !== form.confirmPassword) {
      setError("Mật khẩu mới không khớp.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await authAPI.changePassword(
        form.currentPassword,
        form.newPassword,
        form.confirmPassword
      );
      setSuccess(res.data?.message || "Đổi mật khẩu thành công!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cp-modal-overlay" onClick={onClose}>
      <div className="cp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cp-modal-header">
          <h2>Đổi mật khẩu</h2>
          <button className="cp-close-btn" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>
        
        <form className="cp-form" onSubmit={handleSubmit}>
          <label>
            Mật khẩu hiện tại
            <div className="cp-input-wrap">
              <input
                type={showPw.current ? "text" : "password"}
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="cp-eye-btn"
                onClick={() => toggleShow("current")}
              >
                {showPw.current ? "🙈" : "👁"}
              </button>
            </div>
          </label>

          <label>
            Mật khẩu mới
            <div className="cp-input-wrap">
              <input
                type={showPw.new ? "text" : "password"}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                required
                placeholder="Tối thiểu 8 ký tự"
              />
              <button
                type="button"
                className="cp-eye-btn"
                onClick={() => toggleShow("new")}
              >
                {showPw.new ? "🙈" : "👁"}
              </button>
            </div>
          </label>

          <label>
            Xác nhận mật khẩu mới
            <div className="cp-input-wrap">
              <input
                type={showPw.confirm ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="cp-eye-btn"
                onClick={() => toggleShow("confirm")}
              >
                {showPw.confirm ? "🙈" : "👁"}
              </button>
            </div>
          </label>

          {error && <p className="cp-error">{error}</p>}
          {success && <p className="cp-success">{success}</p>}

          <div className="cp-actions">
            <button type="button" className="cp-btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="cp-btn-submit" disabled={submitting}>
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
