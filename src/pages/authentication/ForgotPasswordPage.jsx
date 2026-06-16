import { useState } from "react";
import "./Auth.css";
import authAPI from "../../services/auth.service";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");
      await authAPI.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể gửi liên kết đặt lại. Vui lòng thử lại.");
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
            Quên mật khẩu?<br />Đã có chúng tôi.
          </h2>
          <p className="auth-brand__desc">
            Nhập email đã đăng ký của bạn và chúng tôi sẽ gửi liên kết đặt lại an toàn tới hộp thư của bạn. Liên kết có hiệu lực trong 15 phút.
          </p>
        </div>

        <ul className="auth-brand__features">
          <li>Liên kết hết hạn sau 15 phút</li>
          <li>Chỉ sử dụng được một lần</li>
          <li>Gửi tới email đã đăng ký của bạn</li>
        </ul>
      </aside>

      {/* ── Form panel ── */}
      <main className="auth-panel">
        <div className="auth-card">
          <a href="/login" className="auth-back">← Quay lại đăng nhập</a>

          {/* Step indicator */}
          <div className="auth-steps">
            <div className="auth-steps__item auth-steps__item--active">
              <span className="auth-steps__dot">1</span>
              <span className="auth-steps__text">Email</span>
            </div>
            <div className="auth-steps__item">
              <span className="auth-steps__dot">2</span>
              <span className="auth-steps__text">Xác thực</span>
            </div>
            <div className="auth-steps__item">
              <span className="auth-steps__dot">3</span>
              <span className="auth-steps__text">Đặt lại</span>
            </div>
          </div>

          <span className="auth-card__eyebrow">Quên mật khẩu</span>
          <h1>Đặt lại mật khẩu</h1>
          <p className="auth-card__subtitle">
            Chúng tôi sẽ gửi cho bạn một liên kết để tạo mật khẩu mới.
          </p>

          {sent ? (
            <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
              <p className="auth-success">
                ✉️ Liên kết đặt lại đã được gửi tới <strong>{email}</strong>. Vui lòng kiểm tra hộp thư
                (và cả thư mục rác).
              </p>
              <button
                className="auth-form__submit"
                type="button"
                onClick={() => { setSent(false); setEmail(""); }}
                style={{ marginTop: 0 }}
              >
                Gửi tới một email khác
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                Email đã đăng ký
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cbms.vn"
                  required
                  autoComplete="email"
                />
              </label>

              {error && <p className="auth-error">{error}</p>}

              <button
                className="auth-form__submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Đang gửi liên kết…" : "Gửi liên kết đặt lại"}
              </button>
            </form>
          )}

          <p className="auth-card__footer">
            Đã nhớ ra mật khẩu? <a href="/login">Đăng nhập ngay</a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default ForgotPasswordPage;
