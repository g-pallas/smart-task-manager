import { useState } from "react";
import PasswordField from "./PasswordField";

const UserIcon = () => (
  <svg aria-hidden="true" className="auth-field-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M20 21a8 8 0 0 0-16 0" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg aria-hidden="true" className="auth-field-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="4" />
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
  </svg>
);

const LockIcon = () => (
  <svg aria-hidden="true" className="auth-field-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect height="11" rx="2" width="14" x="5" y="11" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

const GoogleMark = () => <span className="google-mark">G</span>;

export default function RegisterForm({
  onRegister,
  formErrors = {},
  onSwitchToLogin,
  loading = false,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    await onRegister({
      name,
      email,
      password,
      password_confirmation: password,
    });
  };

  return (
    <main className="auth-shell">
      <div className="auth-brand auth-brand-register">
        <strong>TaskCurator</strong>
        <span>The Digital Curator</span>
      </div>
      <form onSubmit={submit} className="auth-card">
        <h1 className="auth-title">Create Your Account</h1>
        <p className="auth-copy">Experience task management as an art form.</p>

        <label className="auth-field-label" htmlFor="register-name">Full Name</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon"><UserIcon /></span>
          <input
            id="register-name"
            className="app-input auth-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            autoComplete="name"
            disabled={loading}
          />
        </div>
        {formErrors.name?.[0] && (
          <p className="mt-2 text-sm text-red-600">{formErrors.name[0]}</p>
        )}

        <label className="auth-field-label" htmlFor="register-email">Email</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon"><MailIcon /></span>
          <input
            id="register-email"
            className="app-input auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            disabled={loading}
          />
        </div>
        {formErrors.email?.[0] && (
          <p className="mt-2 text-sm text-red-600">{formErrors.email[0]}</p>
        )}

        <label className="auth-field-label" htmlFor="register-password">Password</label>
        <PasswordField
          id="register-password"
          className="auth-password"
          icon={<LockIcon />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          disabled={loading}
        />
        <div className="password-strength">
          <span />
          <em>Moderate</em>
        </div>
        {formErrors.password?.[0] && (
          <p className="mt-2 text-sm text-red-600">{formErrors.password[0]}</p>
        )}

        <label className="auth-check auth-terms">
          <input type="checkbox" />
          <span>I agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong></span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="btn auth-submit disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
        <div className="auth-divider auth-divider-wide"><span>OR SIGN UP WITH</span></div>
        <button className="auth-google-button" type="button">
          <GoogleMark />
          Google
        </button>

        <button
          type="button"
          onClick={onSwitchToLogin}
          disabled={loading}
          className="auth-switch-link auth-account-link disabled:cursor-not-allowed disabled:opacity-60"
        >
          Already have an account? <strong>Log in</strong>
        </button>
      </form>
    </main>
  );
}
