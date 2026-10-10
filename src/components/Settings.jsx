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

function SettingsPage({
  onDeleteAccount,
  onChangeEmail,
  onChangePassword,
}) {
  // =========================================================
  // SECTION STATE
  // =========================================================

  const [showEmailForm, setShowEmailForm] =
    useState(false);

  const [showPasswordForm, setShowPasswordForm] =
    useState(false);

  // =========================================================
  // CHANGE EMAIL STATE
  // =========================================================

  const [newEmail, setNewEmail] =
    useState("");

  const [emailCurrentPassword, setEmailCurrentPassword] =
    useState("");

  const [showEmailCurrentPassword, setShowEmailCurrentPassword] =
    useState(false);

  const [verificationSent, setVerificationSent] =
    useState(false);

  const [emailSubmitting, setEmailSubmitting] =
    useState(false);

  // =========================================================
  // CHANGE PASSWORD STATE
  // =========================================================

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [passwordUpdated, setPasswordUpdated] =
    useState(false);

  const [passwordSubmitting, setPasswordSubmitting] =
    useState(false);

  // =========================================================
  // DELETE ACCOUNT STATE
  // =========================================================

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [isDeleting, setIsDeleting] =
    useState(false);

  // =========================================================
  // CURRENT USER
  // =========================================================
  //
  // The authenticated user comes from the existing login
  // session instead of being hard-coded.
  //
  // =========================================================

  const currentUser = (() => {
    try {
      const storedUser =
        localStorage.getItem(
          "collabboardUser"
        );

      return storedUser
        ? JSON.parse(storedUser)
        : null;
    } catch (error) {
      console.error(
        "Failed to read current user from localStorage:",
        error
      );

      return null;
    }
  })();

  const currentEmail =
    currentUser?.email ||
    "Email unavailable";

  // =========================================================
  // EMAIL VERIFICATION STATUS
  // =========================================================
  //
  // Do not claim that an email is verified unless the account
  // actually provides a verification value.
  //
  // =========================================================

  const emailVerificationState =
    currentUser?.emailVerified;

  function getEmailVerificationLabel() {
    if (
      emailVerificationState ===
      true
    ) {
      return "Email Verified";
    }

    if (
      emailVerificationState ===
      false
    ) {
      return "Email Not Verified";
    }

    return "Verification Status Unavailable";
  }

  function getEmailVerificationDescription() {
    if (
      emailVerificationState ===
      true
    ) {
      return "Your email address is verified.";
    }

    if (
      emailVerificationState ===
      false
    ) {
      return "Your email address has not been verified yet.";
    }

    return "Your account does not currently provide an email verification status.";
  }

  // =========================================================
  // PASSWORD STRENGTH
  // =========================================================

  function getPasswordStrength(password) {
    if (!password) {
      return {
        label: "",
        score: 0,
      };
    }

    let score = 0;

    if (
      password.length >= 8
    ) {
      score += 1;
    }

    if (
      /[A-Z]/.test(password)
    ) {
      score += 1;
    }

    if (
      /[a-z]/.test(password)
    ) {
      score += 1;
    }

    if (
      /\d/.test(password)
    ) {
      score += 1;
    }

    if (
      /[^A-Za-z0-9]/.test(password)
    ) {
      score += 1;
    }

    if (score <= 2) {
      return {
        label: "Weak",
        score,
      };
    }

    if (score <= 4) {
      return {
        label: "Medium",
        score,
      };
    }

    return {
      label: "Strong",
      score,
    };
  }

  const passwordStrength =
    getPasswordStrength(
      newPassword
    );

  // =========================================================
  // EMAIL VALIDATION
  // =========================================================

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    );
  }

  // =========================================================
  // CHANGE EMAIL
  // =========================================================

  const handleChangeEmail =
    async () => {
      const trimmedEmail =
        newEmail
          .trim()
          .toLowerCase();

      if (!trimmedEmail) {
        window.alert(
          "Please enter a new email address."
        );
        return;
      }

      if (
        !isValidEmail(
          trimmedEmail
        )
      ) {
        window.alert(
          "Please enter a valid email address."
        );
        return;
      }

      if (
        trimmedEmail ===
        currentEmail
          .trim()
          .toLowerCase()
      ) {
        window.alert(
          "The new email address is the same as your current email address."
        );
        return;
      }

      if (
        !emailCurrentPassword
      ) {
        window.alert(
          "Please enter your current password to change your email address."
        );
        return;
      }

      if (
        typeof onChangeEmail !==
        "function"
      ) {
        window.alert(
          "Email change is not connected to the backend yet."
        );
        return;
      }

      setEmailSubmitting(
        true
      );

      setVerificationSent(
        false
      );

      try {
        await onChangeEmail({
          email: trimmedEmail,
          currentPassword:
            emailCurrentPassword,
        });

        setVerificationSent(
          true
        );
      } catch (error) {
        console.error(
          "Failed to change email:",
          error
        );

        window.alert(
          error?.message ||
            "Unable to start the email change process."
        );
      } finally {
        setEmailSubmitting(
          false
        );
      }
    };

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  const handleChangePassword =
    async () => {
      if (
        !currentPassword ||
        !newPassword ||
        !confirmPassword
      ) {
        window.alert(
          "Please complete all password fields."
        );
        return;
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        window.alert(
          "The new password and confirmation do not match."
        );
        return;
      }

      if (
        newPassword ===
        currentPassword
      ) {
        window.alert(
          "Your new password must be different from your current password."
        );
        return;
      }

      if (
        newPassword.length <
        8
      ) {
        window.alert(
          "Your new password must contain at least 8 characters."
        );
        return;
      }

      if (
        typeof onChangePassword !==
        "function"
      ) {
        window.alert(
          "Password change is not connected to the backend yet."
        );
        return;
      }

      setPasswordSubmitting(
        true
      );

      setPasswordUpdated(
        false
      );

      try {
        await onChangePassword({
          currentPassword,
          newPassword,
        });

        setPasswordUpdated(
          true
        );

        setCurrentPassword(
          ""
        );

        setNewPassword(
          ""
        );

        setConfirmPassword(
          ""
        );

        setShowCurrentPassword(
          false
        );

        setShowNewPassword(
          false
        );

        setShowConfirmPassword(
          false
        );
      } catch (error) {
        console.error(
          "Failed to change password:",
          error
        );

        window.alert(
          error?.message ||
            "Unable to update the password."
        );
      } finally {
        setPasswordSubmitting(
          false
        );
      }
    };

  // =========================================================
  // CANCEL EMAIL CHANGE
  // =========================================================

  const cancelEmailChange =
    () => {
      if (
        emailSubmitting
      ) {
        return;
      }

      setShowEmailForm(
        false
      );

      setNewEmail(
        ""
      );

      setEmailCurrentPassword(
        ""
      );

      setShowEmailCurrentPassword(
        false
      );

      setVerificationSent(
        false
      );
    };

  // =========================================================
  // CANCEL PASSWORD CHANGE
  // =========================================================

  const cancelPasswordChange =
    () => {
      if (
        passwordSubmitting
      ) {
        return;
      }

      setShowPasswordForm(
        false
      );

      setCurrentPassword(
        ""
      );

      setNewPassword(
        ""
      );

      setConfirmPassword(
        ""
      );

      setShowCurrentPassword(
        false
      );

      setShowNewPassword(
        false
      );

      setShowConfirmPassword(
        false
      );

      setPasswordUpdated(
        false
      );
    };

  // =========================================================
  // OPEN DELETE MODAL
  // =========================================================

  const openDeleteModal =
    () => {
      setShowDeleteModal(
        true
      );
    };

  // =========================================================
  // CLOSE DELETE MODAL
  // =========================================================

  const closeDeleteModal =
    () => {
      if (isDeleting) {
        return;
      }

      setShowDeleteModal(
        false
      );
    };

  // =========================================================
  // DELETE ACCOUNT
  // =========================================================

  const handleDeleteAccount =
    async () => {
      if (
        typeof onDeleteAccount !==
        "function"
      ) {
        window.alert(
          "Account deletion is not connected to the backend yet."
        );
        return;
      }

      setIsDeleting(
        true
      );

      try {
        // App.jsx owns the authenticated session reset.
        // The Settings page does not clear the session before
        // the backend operation has succeeded.

        await onDeleteAccount();

        setShowDeleteModal(
          false
        );
      } catch (error) {
        console.error(
          "Failed to delete account:",
          error
        );

        window.alert(
          error?.message ||
            "Unable to delete the account."
        );

        setIsDeleting(
          false
        );
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
            <h2>
              Account &amp; Security
            </h2>

            <p>
              Manage your account email
              and password.
            </p>
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
                <h3>
                  Email &amp; Verification
                </h3>

                <p>
                  Manage your email address
                  and verification status.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="collapse-button"
              onClick={() => {
                if (
                  emailSubmitting
                ) {
                  return;
                }

                setShowEmailForm(
                  (current) =>
                    !current
                );

                setVerificationSent(
                  false
                );
              }}
              aria-label={
                showEmailForm
                  ? "Collapse email section"
                  : "Expand email section"
              }
              disabled={
                emailSubmitting
              }
            >
              {showEmailForm ? (
                <ChevronUp
                  size={20}
                />
              ) : (
                <ChevronDown
                  size={20}
                />
              )}
            </button>
          </div>

          {/* CURRENT EMAIL */}

          <div className="current-email-box">
            <div>
              <span className="field-label">
                Current Email
              </span>

              <strong>
                {currentEmail}
              </strong>
            </div>

            <div className="verification-status">
              <CheckCircle2
                size={20}
              />

              <div>
                <strong>
                  {getEmailVerificationLabel()}
                </strong>

                <span>
                  {getEmailVerificationDescription()}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="primary-action-button"
              onClick={() => {
                setShowEmailForm(
                  true
                );

                setVerificationSent(
                  false
                );
              }}
              disabled={
                emailSubmitting
              }
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
                  <h4>
                    Change Email
                  </h4>

                  <p>
                    Enter your new email
                    address and current
                    password to continue.
                  </p>
                </div>
              </div>

              {/* NEW EMAIL */}

              <div className="form-group">
                <label>
                  New Email Address
                </label>

                <div className="input-wrapper">
                  <Mail size={17} />

                  <input
                    type="email"
                    placeholder="Enter new email address"
                    value={
                      newEmail
                    }
                    onChange={(e) => {
                      setNewEmail(
                        e.target.value
                      );

                      setVerificationSent(
                        false
                      );
                    }}
                    disabled={
                      emailSubmitting
                    }
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* CURRENT PASSWORD */}

              <div className="form-group">
                <label>
                  Current Password
                </label>

                <div className="input-wrapper">
                  <Lock size={17} />

                  <input
                    type={
                      showEmailCurrentPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter your current password"
                    value={
                      emailCurrentPassword
                    }
                    onChange={(e) =>
                      setEmailCurrentPassword(
                        e.target.value
                      )
                    }
                    disabled={
                      emailSubmitting
                    }
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowEmailCurrentPassword(
                        (current) =>
                          !current
                      )
                    }
                    disabled={
                      emailSubmitting
                    }
                    aria-label={
                      showEmailCurrentPassword
                        ? "Hide current password"
                        : "Show current password"
                    }
                  >
                    {showEmailCurrentPassword ? (
                      <EyeOff
                        size={17}
                      />
                    ) : (
                      <Eye
                        size={17}
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* SUCCESS MESSAGE */}

              {verificationSent && (
                <div className="success-message">
                  <CheckCircle2
                    size={19}
                  />

                  <div>
                    <strong>
                      Email change request completed
                    </strong>

                    <span>
                      Your email-change handler
                      completed successfully.
                      Follow any verification
                      instructions provided by
                      the account system.
                    </span>
                  </div>
                </div>
              )}

              {/* ACTIONS */}

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    cancelEmailChange
                  }
                  disabled={
                    emailSubmitting
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-action-button"
                  onClick={
                    handleChangeEmail
                  }
                  disabled={
                    emailSubmitting
                  }
                >
                  <Send size={16} />

                  {emailSubmitting
                    ? "Updating..."
                    : "Change Email"}
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
                <h3>
                  Password
                </h3>

                <p>
                  Keep your account secure
                  with a strong password.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="collapse-button"
              onClick={() => {
                if (
                  passwordSubmitting
                ) {
                  return;
                }

                setShowPasswordForm(
                  (current) =>
                    !current
                );

                setPasswordUpdated(
                  false
                );
              }}
              aria-label={
                showPasswordForm
                  ? "Collapse password section"
                  : "Expand password section"
              }
              disabled={
                passwordSubmitting
              }
            >
              {showPasswordForm ? (
                <ChevronUp
                  size={20}
                />
              ) : (
                <ChevronDown
                  size={20}
                />
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
                  <h4>
                    Change Password
                  </h4>

                  <p>
                    Enter your current password
                    and choose a new password.
                  </p>
                </div>
              </div>

              <div className="password-grid">
                {/* CURRENT PASSWORD */}

                <div className="form-group">
                  <label>
                    Current Password
                  </label>

                  <div className="input-wrapper">
                    <Lock size={17} />

                    <input
                      type={
                        showCurrentPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter current password"
                      value={
                        currentPassword
                      }
                      onChange={(e) => {
                        setCurrentPassword(
                          e.target.value
                        );

                        setPasswordUpdated(
                          false
                        );
                      }}
                      disabled={
                        passwordSubmitting
                      }
                      autoComplete="current-password"
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowCurrentPassword(
                          (current) =>
                            !current
                        )
                      }
                      disabled={
                        passwordSubmitting
                      }
                      aria-label={
                        showCurrentPassword
                          ? "Hide current password"
                          : "Show current password"
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff
                          size={17}
                        />
                      ) : (
                        <Eye
                          size={17}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* NEW PASSWORD */}

                <div className="form-group">
                  <label>
                    New Password
                  </label>

                  <div className="input-wrapper">
                    <Lock size={17} />

                    <input
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter new password"
                      value={
                        newPassword
                      }
                      onChange={(e) => {
                        setNewPassword(
                          e.target.value
                        );

                        setPasswordUpdated(
                          false
                        );
                      }}
                      disabled={
                        passwordSubmitting
                      }
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowNewPassword(
                          (current) =>
                            !current
                        )
                      }
                      disabled={
                        passwordSubmitting
                      }
                      aria-label={
                        showNewPassword
                          ? "Hide new password"
                          : "Show new password"
                      }
                    >
                      {showNewPassword ? (
                        <EyeOff
                          size={17}
                        />
                      ) : (
                        <Eye
                          size={17}
                        />
                      )}
                    </button>
                  </div>

                  {newPassword && (
                    <span className="password-strength">
                      Strength:{" "}
                      {
                        passwordStrength.label
                      }
                    </span>
                  )}
                </div>

                {/* CONFIRM PASSWORD */}

                <div className="form-group">
                  <label>
                    Confirm New Password
                  </label>

                  <div className="input-wrapper">
                    <Lock size={17} />

                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Confirm new password"
                      value={
                        confirmPassword
                      }
                      onChange={(e) => {
                        setConfirmPassword(
                          e.target.value
                        );

                        setPasswordUpdated(
                          false
                        );
                      }}
                      disabled={
                        passwordSubmitting
                      }
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword(
                          (current) =>
                            !current
                        )
                      }
                      disabled={
                        passwordSubmitting
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff
                          size={17}
                        />
                      ) : (
                        <Eye
                          size={17}
                        />
                      )}
                    </button>
                  </div>

                  {confirmPassword &&
                    newPassword !==
                      confirmPassword && (
                      <span className="password-mismatch">
                        Passwords do not match.
                      </span>
                    )}
                </div>
              </div>

              {/* SUCCESS MESSAGE */}

              {passwordUpdated && (
                <div className="success-message">
                  <CheckCircle2
                    size={19}
                  />

                  <div>
                    <strong>
                      Password updated successfully!
                    </strong>

                    <span>
                      Your account password has
                      been changed.
                    </span>
                  </div>
                </div>
              )}

              {/* ACTIONS */}

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    cancelPasswordChange
                  }
                  disabled={
                    passwordSubmitting
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-action-button"
                  onClick={
                    handleChangePassword
                  }
                  disabled={
                    passwordSubmitting
                  }
                >
                  <Lock size={16} />

                  {passwordSubmitting
                    ? "Updating..."
                    : "Update Password"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================
            DELETE ACCOUNT
        =================================================== */}

        <div className="delete-account-wrapper">
          <button
            type="button"
            className="delete-account-button"
            onClick={
              openDeleteModal
            }
            disabled={isDeleting}
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
          onMouseDown={
            closeDeleteModal
          }
        >
          <div
            className="delete-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <button
              type="button"
              className="delete-modal-close"
              onClick={
                closeDeleteModal
              }
              disabled={
                isDeleting
              }
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="delete-modal-icon">
              <AlertTriangle
                size={23}
              />
            </div>

            <h3 id="delete-account-title">
              Delete Account?
            </h3>

            <p>
              Are you sure you want
              to delete your account?
            </p>

            <span className="delete-modal-warning">
              This action cannot be
              undone.
            </span>

            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-modal-cancel"
                onClick={
                  closeDeleteModal
                }
                disabled={
                  isDeleting
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-modal-confirm"
                onClick={
                  handleDeleteAccount
                }
                disabled={
                  isDeleting
                }
              >
                <Trash2
                  size={15}
                />

                {isDeleting
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default SettingsPage;