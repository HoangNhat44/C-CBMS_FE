import { useState } from "react";
import "./Auth.css";
import authAPI from "../../services/auth.service";

function getStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_META = [
  null,
  { label: "Yếu", cls: "weak" },
  { label: "Trung bình", cls: "fair" },
  { label: "Tốt", cls: "good" },
  { label: "Mạnh", cls: "strong" },
];

function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const strength = getStrength(form.password);
  const meta = STRENGTH_META[strength];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu không khớp.");
      return;
    }
    if (strength < 2) {
      setError("Hãy chọn một mật khẩu mạnh hơn để tiếp tục.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await authAPI.resetPassword(token, form.password, form.confirmPassword);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Đặt lại thất bại. Liên kết có thể đã hết hạn.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* ── Brand panel ── */}
      <aside className="auth-brand">
        <div className="auth-brand__logo">
          <img src="/logo.png" alt="Logo" className="auth-brand__logo-icon" />
          C-CBMS
        </div>

        <div className="auth-brand__copy">
          <span className="auth-brand__eyebrow">Khôi phục tài khoản</span>
          <h2 className="auth-brand__headline">
            Sắp xong rồi —<br />đặt mật khẩu mới.
          </h2>
          <p className="auth-brand__desc">
            Hãy chọn một mật khẩu bạn chưa từng sử dụng trước đây. Một mật khẩu mạnh giúp giữ an toàn cho dữ liệu đặt bàn và thông tin khách hàng.
          </p>
        </div>

        <ul className="auth-brand__features">
          <li>Ít nhất 8 ký tự</li>
          <li>Kết hợp chữ hoa, chữ thường, số & ký tự đặc biệt</li>
          <li>Không sử dụng lại mật khẩu cũ gần đây</li>
        </ul>
      </aside>

      {/* ── Form panel ── */}
      <main className="auth-panel">
        <div className="auth-card">
          <a href="/forgot-password" className="auth-back">← Quay lại</a>

          {/* Step indicator */}
          <div className="auth-steps">
            <div className="auth-steps__item auth-steps__item--done">
              <span className="auth-steps__dot">✓</span>
              <span className="auth-steps__text">Email</span>
            </div>
            <div className="auth-steps__item auth-steps__item--done">
              <span className="auth-steps__dot">✓</span>
              <span className="auth-steps__text">Xác thực</span>
            </div>
            <div className={`auth-steps__item${done ? " auth-steps__item--done" : " auth-steps__item--active"}`}>
              <span className="auth-steps__dot">{done ? "✓" : "3"}</span>
              <span className="auth-steps__text">Đặt lại</span>
            </div>
          </div>

          <span className="auth-card__eyebrow">Mật khẩu mới</span>
          <h1>Chọn mật khẩu</h1>
          <p className="auth-card__subtitle">
            Mật khẩu mới của bạn phải khác với những mật khẩu đã dùng trước đây.
          </p>

          {done ? (
            <div style={{ display: "grid", gap: 16 }}>
              <p className="auth-success">
                🎉 Cập nhật mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.
              </p>
              <a
                href="/login"
                className="auth-form__submit"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  textDecoration: "none", marginTop: 0,
                }}
              >
                Chuyển đến trang đăng nhập
              </a>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                Mật khẩu mới
                <div className="auth-form__password-wrap">
                  <input
                    name="password"
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Tối thiểu 8 ký tự"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-form__eye"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Ẩn" : "Hiện"}
                  >
                    {showPw ? "🙈" : "👁"}
                  </button>
                </div>
              </label>

              {form.password && (
                <div className="auth-strength">
                  <div className="auth-strength__bar">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`auth-strength__seg${
                          n <= strength ? ` auth-strength__seg--${meta.cls}` : ""
                        }`}
                      />
                    ))}
                  </div>
                  <span className="auth-strength__label">
                    Độ mạnh: {meta?.label || "—"}
                  </span>
                </div>
              )}

              <label>
                Xác nhận mật khẩu mới
                <div className="auth-form__password-wrap">
                  <input
                    name="confirmPassword"
                    type={showCpw ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Nhập lại mật khẩu mới"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="auth-form__eye"
                    onClick={() => setShowCpw((v) => !v)}
                    aria-label={showCpw ? "Ẩn" : "Hiện"}
                  >
                    {showCpw ? "🙈" : "👁"}
                  </button>
                </div>
              </label>

              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="auth-error" style={{ margin: 0 }}>
                  Mật khẩu chưa khớp.
                </p>
              )}

              {error && <p className="auth-error">{error}</p>}

              <button
                className="auth-form__submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Đang lưu…" : "Lưu mật khẩu mới"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default ResetPasswordPage;
