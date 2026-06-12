import { useState } from "react";
import "./Auth.css";

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
  { label: "Weak", cls: "weak" },
  { label: "Fair", cls: "fair" },
  { label: "Good", cls: "good" },
  { label: "Strong", cls: "strong" },
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
      setError("Passwords do not match.");
      return;
    }
    if (!form.agree) {
      setError("You must accept the terms to continue.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      // TODO: call authAPI.register(form)
      await new Promise((r) => setTimeout(r, 1000)); // placeholder
      setSuccess("Account created! You can now sign in.");
      setForm(initialForm);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      {/* ── Brand panel ── */}
      <aside className="auth-brand">
        <div className="auth-brand__logo">
          <span className="auth-brand__logo-icon">🎬</span>
          C-CBMS
        </div>

        <div className="auth-brand__copy">
          <span className="auth-brand__eyebrow">New here?</span>
          <h2 className="auth-brand__headline">
            Create your<br />admin account.
          </h2>
          <p className="auth-brand__desc">
            Get access to booking management, customer records, and full
            reporting tools in under a minute.
          </p>
        </div>

        <ul className="auth-brand__features">
          <li>Free to set up, no card required</li>
          <li>Role-based permission system</li>
          <li>Instant access after approval</li>
          <li>24/7 audit-ready activity logs</li>
        </ul>
      </aside>

      {/* ── Form panel ── */}
      <main className="auth-panel">
        <div className="auth-card">
          <span className="auth-card__eyebrow">Admin Portal</span>
          <h1>Create account</h1>
          <p className="auth-card__subtitle">
            Fill in your details to request admin access.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-form__row">
              <label>
                First name
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Nguyen"
                  required
                />
              </label>
              <label>
                Last name
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Van A"
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
              Phone
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="0900 000 000"
              />
            </label>

            <label>
              Password
              <div className="auth-form__password-wrap">
                <input
                  name="password"
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 8 characters"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-form__eye"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide" : "Show"}
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
                  Strength: {meta?.label || "—"}
                </span>
              </div>
            )}

            <label>
              Confirm password
              <div className="auth-form__password-wrap">
                <input
                  name="confirmPassword"
                  type={showCpw ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-form__eye"
                  onClick={() => setShowCpw((v) => !v)}
                  aria-label={showCpw ? "Hide" : "Show"}
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
              I agree to the{" "}
              <a href="/terms" style={{ color: "#0f766e", fontWeight: 700 }}>
                Terms of Service
              </a>
            </label>

            {error && <p className="auth-error">{error}</p>}
            {success && <p className="auth-success">{success}</p>}

            <button className="auth-form__submit" type="submit" disabled={submitting}>
              {submitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="auth-card__footer">
            Already have an account? <a href="/login">Sign in</a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default RegisterPage;
