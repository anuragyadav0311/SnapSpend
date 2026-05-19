import { useMemo, useState } from "react";
import { BRAND_USER_NAME } from "../components/BrandLockup";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FRONTEND_ONLY_MODE } from "../services/frontendMode";

const STYLES = `
.profile-header {
  margin-bottom: 32px;
}

.profile-title {
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--sand-50);
  letter-spacing: -0.02em;
}

.profile-title em { font-style: italic; color: var(--amber-l); }

.profile-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 20px;
  margin-bottom: 24px;
}

@media (max-width: 980px) {
  .profile-grid { grid-template-columns: 1fr; }
}

.profile-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  padding: 24px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: var(--card-shadow);
  position: relative;
  overflow: hidden;
}

.profile-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--glass-highlight), transparent);
}

.profile-card-title {
  font-family: 'Playfair Display', serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--sand-100);
  margin-bottom: 16px;
}

.profile-card + .profile-card {
  margin-top: 20px;
}

.user-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.user-avatar {
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--sage-d), var(--amber));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: white;
  box-shadow: 0 4px 20px rgba(122,158,135,0.3);
  border: 2px solid var(--sage);
}

.user-info { flex: 1; min-width: 0; }

.user-name {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--sand-50);
  letter-spacing: -0.01em;
}

.user-email {
  font-size: 13px;
  color: var(--sand-500);
  font-weight: 300;
  margin-top: 2px;
}

.user-badge {
  display: inline-block;
  margin-top: 6px;
  padding: 3px 10px;
  border-radius: 12px;
  background: var(--focus-fill);
  border: 1px solid var(--sage);
  font-size: 10.5px;
  font-weight: 500;
  color: var(--sage-l);
  letter-spacing: 0.04em;
}

.pref-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid var(--surface-border);
}

.pref-row:last-child { border-bottom: none; }

.pref-label {
  font-size: 13px;
  color: var(--sand-300);
  font-weight: 400;
}

.pref-value {
  font-family: 'DM Mono', monospace;
  font-size: 12.5px;
  color: var(--sand-400);
}

.theme-card-inner {
  display: flex;
  gap: 12px;
}

.theme-option {
  flex: 1;
  padding: 16px;
  border-radius: 12px;
  border: 2px solid var(--surface-strong);
  background: var(--surface-soft);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-option:hover { background: var(--surface-soft-2); }

.theme-option.active {
  border-color: var(--sage-l);
  background: var(--focus-fill);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.theme-option-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin: 0 auto 8px;
}

.theme-option-label {
  font-size: 12px;
  color: var(--sand-300);
  font-weight: 500;
}

.profile-form {
  display: grid;
  gap: 12px;
}

.profile-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

@media (max-width: 700px) {
  .profile-form-row {
    grid-template-columns: 1fr;
  }
}

.profile-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-field label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--sand-500);
}

.profile-input {
  width: 100%;
  background: var(--surface-soft-2);
  border: 1px solid var(--surface-strong);
  border-radius: 10px;
  padding: 11px 12px;
  font-family: 'Figtree', sans-serif;
  font-size: 13px;
  color: var(--sand-100);
  outline: none;
}

.profile-input:focus {
  border-color: var(--sage);
  box-shadow: 0 0 0 3px var(--focus-ring);
}

.profile-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.profile-btn {
  padding: 9px 14px;
  border-radius: 10px;
  border: 1px solid var(--surface-strong);
  background: var(--surface-soft);
  font-family: 'Figtree', sans-serif;
  font-size: 12.5px;
  color: var(--sand-300);
  cursor: pointer;
  transition: all 0.2s;
}

.profile-btn:hover {
  background: var(--surface-soft-2);
  color: var(--sand-100);
}

.profile-btn.primary {
  border: none;
  background: linear-gradient(135deg, var(--sage-l), var(--amber-l));
  color: var(--ink);
  box-shadow: var(--btn-shadow);
}

.profile-btn.primary:hover {
  box-shadow: var(--btn-shadow-hover);
  transform: translateY(-1px);
}

.profile-btn.danger {
  border-color: var(--rose);
  color: var(--rose);
  background: transparent;
}

.profile-btn.danger:hover {
  background: rgba(184,112,112,0.1);
}

.profile-message {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 12.5px;
  border: 1px solid var(--surface-strong);
  background: var(--surface-soft);
  color: var(--sand-200);
}

.profile-message.error {
  border-color: rgba(184,112,112,0.35);
  color: var(--rose);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid var(--surface-border);
}

.activity-item:last-child { border-bottom: none; }

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--sage-l);
  margin-top: 6px;
  flex-shrink: 0;
}

.activity-text {
  flex: 1;
  font-size: 12.5px;
  color: var(--sand-300);
}

.activity-time {
  font-size: 10.5px;
  color: var(--sand-500);
  font-family: 'DM Mono', monospace;
}

@keyframes riseIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

export default function Profile() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileDraft, setProfileDraft] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [passwordDraft, setPasswordDraft] = useState({
    current_password: "",
    new_password: "",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const initials = useMemo(() => {
    const source = user?.name?.trim() || user?.email || "L";
    return source.charAt(0).toUpperCase();
  }, [user?.email, user?.name]);

  const handleProfileSave = async () => {
    setProfileError("");
    setProfileMessage("");
    setSavingProfile(true);

    try {
      const updatedUser = await updateProfile({
        name: profileDraft.name.trim(),
        email: profileDraft.email.trim(),
      });

      setProfileDraft({
        name: updatedUser.name,
        email: updatedUser.email,
      });
      setProfileMessage("Profile updated successfully.");
    } catch (error) {
      setProfileError(error.message || "Unable to update your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async () => {
    setPasswordError("");
    setPasswordMessage("");
    setSavingPassword(true);

    try {
      await changePassword(passwordDraft);
      setPasswordDraft({ current_password: "", new_password: "" });
      setPasswordMessage("Password updated successfully.");
    } catch (error) {
      setPasswordError(error.message || "Unable to update your password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <>
      <style>{STYLES}</style>

      <div style={{ opacity: 0, animation: "riseIn 0.6s 0.1s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div className="profile-header">
          <h1 className="profile-title">Your <em>profile.</em></h1>
        </div>
      </div>

      <div className="profile-card" style={{ marginBottom: 24, opacity: 0, animation: "riseIn 0.6s 0.2s cubic-bezier(0.22,1,0.36,1) forwards" }}>
        <div className="user-hero">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || BRAND_USER_NAME}</div>
            <div className="user-email">{user?.email || "No email loaded"}</div>
            <div className="user-badge">AUTHENTICATED ACCOUNT</div>
          </div>
          <button className="profile-btn danger" type="button" onClick={logout}>
            Sign Out
          </button>
        </div>
      </div>

      <div className="profile-grid">
        <div style={{ opacity: 0, animation: "riseIn 0.6s 0.3s cubic-bezier(0.22,1,0.36,1) forwards" }}>
          <div className="profile-card">
            <div className="profile-card-title">Profile Details</div>
            <div className="profile-form">
              <div className="profile-form-row">
                <div className="profile-field">
                  <label htmlFor="profile-name">Full Name</label>
                  <input
                    id="profile-name"
                    className="profile-input"
                    value={profileDraft.name}
                    onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>
                <div className="profile-field">
                  <label htmlFor="profile-email">Email</label>
                  <input
                    id="profile-email"
                    className="profile-input"
                    type="email"
                    value={profileDraft.email}
                    onChange={(event) => setProfileDraft((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>
              </div>

              <div className="profile-actions">
                <button className="profile-btn primary" type="button" disabled={savingProfile} onClick={handleProfileSave}>
                  {savingProfile ? "Saving..." : "Save Profile"}
                </button>
              </div>

              {profileMessage && <div className="profile-message">{profileMessage}</div>}
              {profileError && <div className="profile-message error">{profileError}</div>}
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-card-title">Security</div>
            <div className="profile-form">
              <div className="profile-field">
                <label htmlFor="current-password">Current Password</label>
                <input
                  id="current-password"
                  className="profile-input"
                  type="password"
                  value={passwordDraft.current_password}
                  onChange={(event) =>
                    setPasswordDraft((current) => ({ ...current, current_password: event.target.value }))
                  }
                />
              </div>
              <div className="profile-field">
                <label htmlFor="new-password">New Password</label>
                <input
                  id="new-password"
                  className="profile-input"
                  type="password"
                  value={passwordDraft.new_password}
                  onChange={(event) =>
                    setPasswordDraft((current) => ({ ...current, new_password: event.target.value }))
                  }
                />
              </div>

              <div className="profile-actions">
                <button className="profile-btn primary" type="button" disabled={savingPassword} onClick={handlePasswordSave}>
                  {savingPassword ? "Updating..." : "Change Password"}
                </button>
              </div>

              {passwordMessage && <div className="profile-message">{passwordMessage}</div>}
              {passwordError && <div className="profile-message error">{passwordError}</div>}
            </div>
          </div>
        </div>

        <div style={{ opacity: 0, animation: "riseIn 0.6s 0.38s cubic-bezier(0.22,1,0.36,1) forwards" }}>
          <div className="profile-card">
            <div className="profile-card-title">Preferences</div>
            <div className="pref-row">
              <span className="pref-label">Theme</span>
              <span className="pref-value">{theme === "dark" ? "Dark" : "Light"}</span>
            </div>
            <div className="theme-card-inner" style={{ marginTop: 14 }}>
              <button
                className={`theme-option${theme === "light" ? " active" : ""}`}
                type="button"
                onClick={() => theme !== "light" && toggleTheme()}
              >
                <div className="theme-option-icon" style={{ background: "linear-gradient(135deg, #f5f0e8, #e8e2d8)" }} />
                <div className="theme-option-label">Light</div>
              </button>
              <button
                className={`theme-option${theme === "dark" ? " active" : ""}`}
                type="button"
                onClick={() => theme !== "dark" && toggleTheme()}
              >
                <div className="theme-option-icon" style={{ background: "linear-gradient(135deg, #1a1816, #2a2522)" }} />
                <div className="theme-option-label">Dark</div>
              </button>
            </div>
          </div>

          <div className="profile-card">
            <div className="profile-card-title">Recent Account Activity</div>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-dot" />
                <div className="activity-text">
                  {FRONTEND_ONLY_MODE
                    ? "You are using the polished frontend demo mode with local profile data."
                    : "Your profile is synced with the live account data."}
                </div>
                <div className="activity-time">Current</div>
              </div>
              <div className="activity-item">
                <div className="activity-dot" style={{ background: "var(--amber)" }} />
                <div className="activity-text">
                  {FRONTEND_ONLY_MODE
                    ? "Changes made here are stored locally so you can review the full interface without the backend."
                    : "Profile updates save directly to your account record."}
                </div>
                <div className="activity-time">Updated</div>
              </div>
              <div className="activity-item">
                <div className="activity-dot" style={{ background: "var(--rose)" }} />
                <div className="activity-text">
                  {FRONTEND_ONLY_MODE
                    ? "Security actions are simulated here so the experience stays smooth during UI work."
                    : "Security changes are sent through the real authentication flow."}
                </div>
                <div className="activity-time">Secure</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
