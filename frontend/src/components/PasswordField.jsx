import { useState } from "react";

function EyeIcon({ hidden }) {
  return (
    <svg
      aria-hidden="true"
      className="password-toggle-icon"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {hidden && <path d="m3 3 18 18" />}
    </svg>
  );
}

export default function PasswordField({
  className = "",
  icon = null,
  placeholder = "Password",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const label = showPassword ? "Hide password" : "Show password";

  return (
    <div className={`password-field ${icon ? "password-field-with-icon" : ""} ${className}`}>
      {icon && <span className="auth-input-icon">{icon}</span>}
      <input
        {...props}
        className="app-input password-field-input"
        placeholder={placeholder}
        type={showPassword ? "text" : "password"}
      />
      <button
        aria-label={label}
        className="password-toggle"
        disabled={props.disabled}
        title={label}
        type="button"
        onClick={() => setShowPassword((current) => !current)}
      >
        <EyeIcon hidden={showPassword} />
      </button>
    </div>
  );
}
