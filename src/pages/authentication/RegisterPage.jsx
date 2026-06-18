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
  return score; // 0-4
}

const STRENGTH_META = [
  null,
  { label: "Yếu", cls: "weak" },
  { label: "Trung bình", cls: "fair" },
  { label: "Tốt", cls: "good" },
  { label: "Mạnh", cls: "strong" },
];

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  agree: false,
};

function RegisterPage() {
  const [form, setForm] = useState(initialForm);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const strength = getStrength(form.password);
  const meta = STRENGTH_META[strength];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (form.password !== form.confirmPassword) {
    setError("Mật khẩu không khớp.");
    return;
  }
  if (!form.agree) {
    setError("Bạn phải đồng ý với các điều khoản để tiếp tục.");
    return;
  }

  try {
    setSubmitting(true);
    setError("");

    const response = await authAPI.register({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      password: form.password,
      confirmPassword: form.confirmPassword,
    });

    console.log(response.data);

    setSuccess("Tạo tài khoản thành công! Bạn có thể chờ duyệt và đăng nhập.");
    setForm(initialForm);

  } catch (err) {
    setError(
      err.response?.data?.message ||
      "Đăng ký thất bại. Vui lòng thử lại."
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
          <span className="auth-brand__eyebrow">Lần đầu đến đây?</span>
          <h2 className="auth-brand__headline">
            Tạo tài khoản<br />mới.
          </h2>
          <p className="auth-brand__desc">
            Truy cập quản lý đặt bàn, thông tin khách hàng và công cụ báo cáo đầy đủ chỉ trong chốc lát.
          </p>
        </div>

        <ul className="auth-brand__features">
          <li>Thiết lập hoàn toàn miễn phí</li>
          <li>Hệ thống phân quyền theo vai trò</li>
          <li>Truy cập ngay sau khi được duyệt</li>
          <li>Lưu trữ nhật ký hoạt động đầy đủ</li>
        </ul>
      </aside>

      {/* ── Form panel ── */}
      <main className="auth-panel">
        <div className="auth-card">
          <span className="auth-card__eyebrow">Cổng Quản Trị</span>
          <h1>Tạo tài khoản</h1>
          <p className="auth-card__subtitle">
            Điền thông tin của bạn để đăng ký tài khoản.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form__row">
              <label>
                Họ
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Nguyễn"
                  required
                />
              </label>
              <label>
                Tên
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Văn A"
                  required
                />
              </label>
            </div>

            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </label>

            <label>
              Số điện thoại
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="0900 000 000"
                required
              />
            </label>

            <label>
              Mật khẩu
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
              Xác nhận mật khẩu
              <div className="auth-form__password-wrap">
                <input
                  name="confirmPassword"
                  type={showCpw ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu"
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

            <label className="auth-form__remember" style={{ marginTop: 2 }}>
              <input
                name="agree"
                type="checkbox"
                checked={form.agree}
                onChange={handleChange}
              />
              Tôi đồng ý với{" "}
              <a href="/terms" style={{ color: "#0f766e", fontWeight: 700 }}>
                Điều khoản dịch vụ
              </a>
            </label>

            {error && <p className="auth-error">{error}</p>}
            {success && <p className="auth-success">{success}</p>}

            <button className="auth-form__submit" type="submit" disabled={submitting}>
              {submitting ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
            </button>
          </form>

          <p className="auth-card__footer">
            Đã có tài khoản? <a href="/login">Đăng nhập</a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default RegisterPage;
