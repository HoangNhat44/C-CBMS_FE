import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Auth.css";
import authAPI from "../../services/auth.service";

function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError("");

      const response = await authAPI.login(form.email, form.password);
      const { token, user } = response.data.data;

      login(user, token);

      // Điều hướng theo permission
      const permissions = user?.role?.permissions || user?.roleId?.permissions || [];
      const codes = permissions.map(p => p.code || p);

      let destination = "/landing-dashboard";
      if (codes.includes("VIEW_ROLE") || codes.includes("VIEW_ACCOUNT")) {
        destination = "/admin-dashboard";
      } else if (codes.includes("VIEW_REVENUE")) {
        destination = "/owner-dashboard";
      } else if (codes.includes("VIEW_BOOKING_SCHEDULE") || codes.includes("UPDATE_BOOKING")) {
        destination = "/staff-dashboard";
      }

      navigate(destination, { replace: true });

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Login failed"
      );
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
          <span className="auth-brand__eyebrow">Nền tảng Cà phê & Điện ảnh</span>
          <h2 className="auth-brand__headline">
            Đặt phòng, dịch vụ,<br />quản lý tập trung.
          </h2>
          <p className="auth-brand__desc">
            Quản lý đặt bàn cà phê, phòng chiếu phim và thông tin khách hàng từ
            một giao diện quản trị duy nhất.
          </p>
        </div>

        <ul className="auth-brand__features">
          <li>Cập nhật trạng thái phòng theo thời gian thực</li>
          <li>Đồng bộ tài khoản khách hàng</li>
          <li>Phân quyền truy cập theo vai trò</li>
          <li>Báo cáo doanh thu & lịch sử đặt phòng</li>
        </ul>
      </aside>

      {/* ── Form panel ── */}
      <main className="auth-panel">
        <div className="auth-card">
          <span className="auth-card__eyebrow">Cổng Quản Trị</span>
          <h1>Đăng nhập</h1>
          <p className="auth-card__subtitle">
            Nhập thông tin xác thực của bạn để truy cập hệ thống.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@cbms.vn"
                required
                autoComplete="email"
              />
            </label>

            <label>
              Mật khẩu
              <div className="auth-form__password-wrap">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-form__eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </label>

            <div className="auth-form__helpers">
              <label className="auth-form__remember">
                <input
                  name="remember"
                  type="checkbox"
                  checked={form.remember}
                  onChange={handleChange}
                />
                Ghi nhớ đăng nhập
              </label>
              <a href="/forgot-password" className="auth-form__forgot">
                Quên mật khẩu?
              </a>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button className="auth-form__submit" type="submit" disabled={submitting}>
              {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
            </button>
          </form>

          <p className="auth-card__footer">
            Chưa có tài khoản?{" "}
            <a href="/register">Tạo ngay</a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;