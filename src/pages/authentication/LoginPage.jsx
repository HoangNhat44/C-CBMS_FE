import { useState } from "react";
import "./Auth.css";
import authAPI from "../../services/auth.service";
function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

    console.log(response.data);

    localStorage.setItem(
      "token",
      response.data.data.token
    );

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
          <span className="auth-brand__eyebrow">Café & Cinema Platform</span>
          <h2 className="auth-brand__headline">
            Bookings, orders,<br />one dashboard.
          </h2>
          <p className="auth-brand__desc">
            Manage café reservations, cinema seats, and customer records from a
            single admin interface.
          </p>
        </div>

        <ul className="auth-brand__features">
          <li>Real-time seat availability</li>
          <li>Unified customer accounts</li>
          <li>Role-based access control</li>
          <li>Revenue & booking reports</li>
        </ul>
      </aside>

      {/* ── Form panel ── */}
      <main className="auth-panel">
        <div className="auth-card">
          <span className="auth-card__eyebrow">Admin Portal</span>
          <h1>Sign in</h1>
          <p className="auth-card__subtitle">
            Enter your credentials to access the dashboard.
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
              Password
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
                Remember me
              </label>
              <a href="/forgot-password" className="auth-form__forgot">
                Forgot password?
              </a>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button className="auth-form__submit" type="submit" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="auth-card__footer">
            Don't have an account?{" "}
            <a href="/register">Create one</a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
