import { useEffect, useState } from "react";

const defaultPreferences = {
  desktop_notifications: true,
  dark_mode: false,
  ai_suggestions: true,
};

export default function SettingsPage({
  currentUser,
  errors = {},
  onUpdateProfile,
  onUpdatePassword,
  onUpdatePreferences,
}) {
  const displayName = currentUser?.name || "User";
  const email = currentUser?.email || "user@example.com";
  const [profileName, setProfileName] = useState(displayName);
  const [profileEmail, setProfileEmail] = useState(email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [preferences, setPreferences] = useState({
    ...defaultPreferences,
    ...(currentUser?.preferences ?? {}),
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    setProfileName(displayName);
    setProfileEmail(email);
    setPreferences({ ...defaultPreferences, ...(currentUser?.preferences ?? {}) });
  }, [currentUser, displayName, email]);

  const submitProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await onUpdateProfile({ name: profileName, email: profileEmail });
    } finally {
      setSavingProfile(false);
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      const ok = await onUpdatePassword({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      });
      if (ok) {
        setCurrentPassword("");
        setPassword("");
        setPasswordConfirmation("");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const togglePreference = async (key) => {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    await onUpdatePreferences(next);
  };

  return (
    <section className="settings-page">
      <header className="settings-topbar">
        <label className="search-box settings-search-box">
          <svg aria-hidden="true" className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" />
          </svg>
          <input placeholder="Search settings..." />
        </label>
        <div className="topbar-actions">
          <button className="icon-button" type="button" aria-label="Notifications">
            <svg className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </button>
          <button className="avatar-button" type="button">
            {displayName.slice(0, 1).toUpperCase()}
          </button>
        </div>
      </header>

      <section className="settings-heading">
        <h1>Personal Profile</h1>
        <p>Manage how you appear to others and your basic identity.</p>
      </section>

      <section className="profile-card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">{displayName.slice(0, 1).toUpperCase()}</div>
        </div>
        <div className="profile-main">
          <h2>{displayName}</h2>
          <p>{email}</p>
          <div className="profile-badges">
            <span>Pro Member</span>
            <span>Joined Oct 2023</span>
          </div>
        </div>
      </section>

      <div className="settings-grid">
        <section>
          <div className="settings-section-heading">
            <h2>Account Security</h2>
            <p>Update your credentials and connected services.</p>
          </div>
          <div className="settings-list">
            <form className="settings-row settings-form-row" onSubmit={submitProfile}>
              <span className="settings-row-icon">
                <svg className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 21a8 8 0 1 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span>
                <strong>Profile</strong>
                <small>Name and email</small>
                <input className="app-input" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                {errors.name?.[0] && <small className="settings-error">{errors.name[0]}</small>}
                <input className="app-input" type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
                {errors.email?.[0] && <small className="settings-error">{errors.email[0]}</small>}
              </span>
              <button className="text-link" disabled={savingProfile}>{savingProfile ? "Saving..." : "Save"}</button>
            </form>

            <form className="settings-row settings-form-row" onSubmit={submitPassword}>
              <span className="settings-row-icon">
                <svg className="ui-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect height="11" rx="2" width="16" x="4" y="11" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              </span>
              <span>
                <strong>Password</strong>
                <small>Change your login password</small>
                <input className="app-input" type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                <input className="app-input" type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <input className="app-input" type="password" placeholder="Confirm password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} />
                {errors.password?.[0] && <small className="settings-error">{errors.password[0]}</small>}
              </span>
              <button className="text-link" disabled={savingPassword}>{savingPassword ? "Saving..." : "Update"}</button>
            </form>
          </div>
        </section>

        <section>
          <div className="settings-section-heading">
            <h2>App Experience</h2>
            <p>Customize your workspace environment.</p>
          </div>
          <div className="experience-card">
            {[
              ["desktop_notifications", "Desktop Notifications"],
              ["dark_mode", "Dark Mode"],
              ["ai_suggestions", "AI Suggestions"],
            ].map(([key, label]) => (
              <label className="experience-row" key={key}>
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(preferences[key])}
                  onChange={() => togglePreference(key)}
                />
              </label>
            ))}
          </div>
        </section>
      </div>

      <section className="privacy-section">
        <h2>Data &amp; Privacy</h2>
        <div className="privacy-grid">
          <article>
            <h3>Export Workspace Data</h3>
            <p>Download features can be added later; your data remains available through the API.</p>
          </article>
          <article>
            <h3>Privacy Controls</h3>
            <p>Preferences and profile changes are now stored with your account.</p>
          </article>
        </div>
      </section>
    </section>
  );
}
