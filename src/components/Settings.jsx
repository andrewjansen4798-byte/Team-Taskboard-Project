import { useState } from "react";
import {
  Mail,
  Lock,
  CheckCircle2,
  Pencil,
  Eye,
  EyeOff,
  Send,
  ChevronUp,
  ChevronDown,
  Trash2,
  AlertTriangle,
  X,
} from "lucide-react";

import "./Settings.css";

function SettingsPage({ onDeleteAccount }) {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [newEmail, setNewEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [verificationSent, setVerificationSent] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  // =========================================================
  // DELETE ACCOUNT
  // =========================================================

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // =========================================================
  // CHANGE EMAIL
  // =========================================================

  const handleChangeEmail = () => {
    if (!newEmail.trim()) {
      return;
    }

    setVerificationSent(true);
  };

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  const handleChangePassword = () => {
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword ||
      newPassword !== confirmPassword
    ) {
      return;
    }

    setPasswordUpdated(true);
  };

  // =========================================================
  // CANCEL EMAIL CHANGE
  // =========================================================

  const cancelEmailChange = () => {
    setShowEmailForm(false);
    setNewEmail("");
    setVerificationSent(false);
  };

  // =========================================================
  // CANCEL PASSWORD CHANGE
  // =========================================================

  const cancelPasswordChange = () => {
    setShowPasswordForm(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordUpdated(false);
  };

  // =========================================================
  // OPEN DELETE MODAL
  // =========================================================

  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  // =========================================================
  // CLOSE DELETE MODAL
  // =========================================================

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }

    setShowDeleteModal(false);
  };

  // =========================================================
  // DELETE ACCOUNT
  // =========================================================

  const handleDeleteAccount = async () => {
    setIsDeleting(true);

    try {
      // Clear frontend session data
      localStorage.removeItem("collabboardToken");
      localStorage.removeItem("collabboardUser");
      localStorage.removeItem("collabboardWorkspaceName");
      localStorage.removeItem("collabboardWorkspaceCode");

      // Let App.jsx handle logout/reset when connected
      if (typeof onDeleteAccount === "function") {
        await onDeleteAccount();
        return;
      }

      // Frontend-only fallback
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete account:", error);
      setIsDeleting(false);
    }
  };

  return (
    <main className="settings-page">
      {/* =====================================================
          ACCOUNT & SECURITY
      ===================================================== */}

      <section className="settings-container">
        <div className="settings-section-title">
          <div className="settings-section-icon">
            <Lock size={22} />
          </div>

          <div>
            <h2>Account &amp; Security</h2>
            <p>Manage your account email and password.</p>
          </div>
        </div>

        {/* ===================================================
            EMAIL SECTION
        =================================================== */}

        <div className="security-card">
          <div className="security-card-header">
            <div className="security-title-wrapper">
              <div className="security-icon email-icon">
                <Mail size={22} />
              </div>

              <div>
                <h3>Email &amp; Verification</h3>
                <p>
                  Manage your email address and verification status.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="collapse-button"
              onClick={() => setShowEmailForm(!showEmailForm)}
              aria-label={
                showEmailForm
                  ? "Collapse email section"
                  : "Expand email section"
              }
            >
              {showEmailForm ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
          </div>

          {/* CURRENT EMAIL */}

          <div className="current-email-box">
            <div>
              <span className="field-label">Current Email</span>
              <strong>andrew.jansen@example.com</strong>
            </div>

            <div className="verification-status">
              <CheckCircle2 size={20} />

              <div>
                <strong>Email Verified</strong>
                <span>Your email address is verified.</span>
              </div>
            </div>

            <button
              type="button"
              className="primary-action-button"
              onClick={() => {
                setShowEmailForm(true);
                setVerificationSent(false);
              }}
            >
              <Pencil size={16} />
              Change Email
            </button>
          </div>

          {/* CHANGE EMAIL FORM */}

          {showEmailForm && (
            <div className="expanded-form">
              <div className="expanded-form-heading">
                <div className="form-heading-icon">
                  <Mail size={19} />
                </div>

                <div>
                  <h4>Change Email</h4>
                  <p>
                    Enter your new email address and we'll send a
                    verification link.
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label>New Email Address</label>

                <div className="input-wrapper">
                  <Mail size={17} />

                  <input
                    type="email"
                    placeholder="Enter new email address"
                    value={newEmail}
                    onChange={(e) => {
                      setNewEmail(e.target.value);
                      setVerificationSent(false);
                    }}
                  />
                </div>
              </div>

              {verificationSent && (
                <div className="success-message">
                  <CheckCircle2 size={19} />

                  <div>
                    <strong>Verification email sent!</strong>
                    <span>
                      Check your new email address and click the
                      verification link to complete the email change.
                    </span>
                  </div>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={cancelEmailChange}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-action-button"
                  onClick={handleChangeEmail}
                >
                  <Send size={16} />
                  Send Verification Email
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================
            PASSWORD SECTION
        =================================================== */}

        <div className="security-card">
          <div className="security-card-header">
            <div className="security-title-wrapper">
              <div className="security-icon password-icon">
                <Lock size={22} />
              </div>

              <div>
                <h3>Password</h3>
                <p>
                  Keep your account secure with a strong password.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="collapse-button"
              onClick={() => {
                setShowPasswordForm(!showPasswordForm);
                setPasswordUpdated(false);
              }}
              aria-label={
                showPasswordForm
                  ? "Collapse password section"
                  : "Expand password section"
              }
            >
              {showPasswordForm ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
          </div>

          {/* CHANGE PASSWORD FORM */}

          {showPasswordForm && (
            <div className="expanded-form">
              <div className="expanded-form-heading">
                <div className="form-heading-icon">
                  <Lock size={19} />
                </div>

                <div>
                  <h4>Change Password</h4>
                  <p>
                    Enter your current password and choose a new password.
                  </p>
                </div>
              </div>

              <div className="password-grid">
                {/* CURRENT PASSWORD */}

                <div className="form-group">
                  <label>Current Password</label>

                  <div className="input-wrapper">
                    <Lock size={17} />

                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setPasswordUpdated(false);
                      }}
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      aria-label={
                        showCurrentPassword
                          ? "Hide current password"
                          : "Show current password"
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </div>

                {/* NEW PASSWORD */}

                <div className="form-group">
                  <label>New Password</label>

                  <div className="input-wrapper">
                    <Lock size={17} />

                    <input
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordUpdated(false);
                      }}
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      aria-label={
                        showNewPassword
                          ? "Hide new password"
                          : "Show new password"
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}

                <div className="form-group">
                  <label>Confirm New Password</label>

                  <div className="input-wrapper">
                    <Lock size={17} />

                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordUpdated(false);
                      }}
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* PASSWORD SUCCESS MESSAGE */}

              {passwordUpdated && (
                <div className="success-message">
                  <CheckCircle2 size={19} />

                  <div>
                    <strong>Password updated successfully!</strong>
                    <span>
                      Your account password has been changed.
                    </span>
                  </div>
                </div>
              )}

              {/* FORM ACTIONS */}

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={cancelPasswordChange}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-action-button"
                  onClick={handleChangePassword}
                >
                  <Lock size={16} />
                  Update Password
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================
            DELETE ACCOUNT BUTTON
        =================================================== */}

        <div className="delete-account-wrapper">
          <button
            type="button"
            className="delete-account-button"
            onClick={openDeleteModal}
          >
            <Trash2 size={17} />
            Delete Account
          </button>
        </div>
      </section>

      {/* =====================================================
          DELETE ACCOUNT CONFIRMATION POPUP
      ===================================================== */}

      {showDeleteModal && (
        <div
          className="delete-modal-overlay"
          onMouseDown={closeDeleteModal}
        >
          <div
            className="delete-modal"
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <button
              type="button"
              className="delete-modal-close"
              onClick={closeDeleteModal}
              disabled={isDeleting}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="delete-modal-icon">
              <AlertTriangle size={23} />
            </div>

            <h3 id="delete-account-title">
              Delete Account?
            </h3>

            <p>
              Are you sure you want to delete your account?
            </p>

            <span className="delete-modal-warning">
              This action cannot be undone.
            </span>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-modal-cancel"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-modal-confirm"
                onClick={handleDeleteAccount}
                disabled={isDeleting}
              >
                <Trash2 size={15} />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default SettingsPage;