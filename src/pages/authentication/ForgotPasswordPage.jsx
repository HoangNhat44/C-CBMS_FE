import { useState } from "react";
import "./Auth.css";

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
      // TODO: call authAPI.forgotPassword({ email })
      await new Promise((r) => setTimeout(r, 1000)); // placeholder
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send reset link. Try again.");
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
            Locked out?<br />We've got you.
          </h2>
          <p className="auth-brand__desc">
            Enter your registered email and we'll send a secure reset link
            straight to your inbox. It expires in 15 minutes.
          </p>
        </div>

        <ul className="auth-brand__features">
          <li>Link expires after 15 minutes</li>
          <li>One-time use only</li>
          <li>Sent to your registered email</li>
        </ul>
      </aside>

      {/* ── Form panel ── */}
      <main className="auth-panel">
        <div className="auth-card">
          <a href="/login" className="auth-back">← Back to sign in</a>

          {/* Step indicator */}
          <div className="auth-steps">
            <div className="auth-steps__item auth-steps__item--active">
              <span className="auth-steps__dot">1</span>
              <span className="auth-steps__text">Email</span>
            </div>
            <div className="auth-steps__item">
              <span className="auth-steps__dot">2</span>
              <span className="auth-steps__text">Verify</span>
            </div>
            <div className="auth-steps__item">
              <span className="auth-steps__dot">3</span>
              <span className="auth-steps__text">Reset</span>
            </div>
          </div>

          <span className="auth-card__eyebrow">Forgot password</span>
          <h1>Reset your password</h1>
          <p className="auth-card__subtitle">
            We'll email you a link to create a new password.
          </p>

          {sent ? (
            <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
              <p className="auth-success">
                ✉️ Reset link sent to <strong>{email}</strong>. Check your inbox
                (and spam folder).
              </p>
              <button
                className="auth-form__submit"
                type="button"
                onClick={() => { setSent(false); setEmail(""); }}
                style={{ marginTop: 0 }}
              >
                Send to a different email
              </button>
            </div>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                Registered email
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
                {submitting ? "Sending link…" : "Send reset link"}
              </button>
            </form>
          )}

          <p className="auth-card__footer">
            Remembered it? <a href="/login">Sign in instead</a>
          </p>
        </div>
      </main>
    </div>
  );
}

export default ForgotPasswordPage;
