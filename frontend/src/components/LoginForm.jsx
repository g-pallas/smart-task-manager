import { useState } from "react";
import PasswordField from "./PasswordField";

const MailIcon = () => (
  <svg aria-hidden="true" className="auth-field-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M4 6h16v12H4z" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);

const LockIcon = () => (
  <svg aria-hidden="true" className="auth-field-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect height="11" rx="2" width="14" x="5" y="11" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

const GoogleMark = () => <span className="google-mark">G</span>;

export default function LoginForm({
  onLogin,
  onSwitchToRegister,
  loading = false,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    await onLogin({ email, password });
  };

  return (
    <main className="auth-shell">
      <div className="auth-brand">
        <strong>TaskCurator</strong>
        <span>The Digital Curator</span>
      </div>
      <form onSubmit={submit} className="auth-card">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-copy">Please enter your details to sign in.</p>

        <label className="auth-field-label" htmlFor="login-email">Email</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon"><MailIcon /></span>
          <input
            id="login-email"
            className="app-input auth-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="curator@example.com"
            autoComplete="email"
            disabled={loading}
          />
        </div>

        <label className="auth-field-label" htmlFor="login-password">Password</label>
        <PasswordField
          id="login-password"
          className="auth-password"
          icon={<LockIcon />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={loading}
        />
        <div className="auth-options-row">
          <label className="auth-check">
            <input type="checkbox" />
            <span>Remember Me</span>
          </label>
          <button className="auth-text-button" type="button">Forgot Password?</button>
        </div>
        <button
          disabled={loading}
          className="btn auth-submit disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Login"}
        </button>
        <div className="auth-divider"><span>OR</span></div>
        <button className="auth-google-button" type="button">
          <GoogleMark />
          Login with Google
        </button>
        <button
          type="button"
          onClick={onSwitchToRegister}
          disabled={loading}
          className="auth-switch-link disabled:cursor-not-allowed disabled:opacity-60"
        >
          Need an account? Create one
        </button>
      </form>
    </main>
  );
}
