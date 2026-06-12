import { useState } from "react";
import "./Auth.css";

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
  { label: "Weak", cls: "weak" },
  { label: "Fair", cls: "fair" },
  { label: "Good", cls: "good" },
  { label: "Strong", cls: "strong" },
];

function ResetPasswordPage() {
  // In a real app, the token comes from the URL: useParams() / useSearchParams()
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
      setError("Passwords do not match.");
      return;
    }
    if (strength < 2) {
      setError("Choose a stronger password before continuing.");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      // TODO: call authAPI.resetPassword({ token, password: form.password })
      await new Promise((r) => setTimeout(r, 1000)); // placeholder
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may have expired.");
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
          <span className="auth-brand__eyebrow">Account recovery</span>
          <h2 className="auth-brand__headline">
            Almost there —<br />set a new password.
          </h2>
          <p className="auth-brand__desc">
            Pick something you haven't used before. A strong password keeps your
            booking data and customer records safe.
          </p>
        </div>

        <ul className="auth-brand__features">
          <li>At least 8 characters</li>
          <li>Mix uppercase, numbers & symbols</li>
          <li>Don't reuse recent passwords</li>
        </ul>
      </aside>

      {/* ── Form panel ── */}
      <main className="auth-panel">
        <div className="auth-card">
          <a href="/forgot-password" className="auth-back">← Back</a>

          {/* Step indicator */}
          <div className="auth-steps">
            <div className="auth-steps__item auth-steps__item--done">
              <span className="auth-steps__dot">✓</span>
              <span className="auth-steps__text">Email</span>
            </div>
            <div className="auth-steps__item auth-steps__item--done">
              <span className="auth-steps__dot">✓</span>
              <span className="auth-steps__text">Verify</span>
            </div>
            <div className={`auth-steps__item${done ? " auth-steps__item--done" : " auth-steps__item--active"}`}>
              <span className="auth-steps__dot">{done ? "✓" : "3"}</span>
              <span className="auth-steps__text">Reset</span>
            </div>
          </div>

          <span className="auth-card__eyebrow">New password</span>
          <h1>Choose a password</h1>
          <p className="auth-card__subtitle">
            Your new password must differ from any you've used before.
          </p>

          {done ? (
            <div style={{ display: "grid", gap: 16 }}>
              <p className="auth-success">
                🎉 Password updated successfully! You can now sign in with your new credentials.
              </p>
              <a
                href="/login"
                className="auth-form__submit"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  textDecoration: "none", marginTop: 0,
                }}
              >
                Go to sign in
              </a>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                New password
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
                Confirm new password
                <div className="auth-form__password-wrap">
                  <input
                    name="confirmPassword"
                    type={showCpw ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat your new password"
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

              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="auth-error" style={{ margin: 0 }}>
                  Passwords don't match yet.
                </p>
              )}

              {error && <p className="auth-error">{error}</p>}

              <button
                className="auth-form__submit"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Save new password"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default ResetPasswordPage;
