import { useEffect, useState } from "react";
import "./Profile.css";

// =========================================================
// BUILD PROFILE FROM SHARED CURRENT USER
// =========================================================
function buildProfile(member, workspaceName = "CollabBoard") {
  const normalizedMembershipStatus = String(
    member?.membershipStatus ||
      member?.status ||
      ""
  )
    .trim()
    .toLowerCase();

  return {
    name: member?.name || "Team Member",
    role:
      member?.workspaceRole ||
      member?.role ||
      "Member",
    email: member?.email || "",
    phone: member?.phone || "",
    location: member?.location || "",
    timeZone:
      member?.timeZone ||
      member?.timezone ||
      "",
    age: member?.age ?? "",
    gender: member?.gender || "",
    projectRole: member?.projectRole || "",
    currentJob: member?.currentJob || "",
    bio: member?.bio || "",
    workspace: workspaceName || "CollabBoard",
    memberSince: member?.joined || "Recently",
    accountStatus:
      member?.accountStatus ||
      (member?.userId ? "Active" : "Non-Active"),
    membershipStatus:
      normalizedMembershipStatus === "inactive"
        ? "Inactive"
        : normalizedMembershipStatus === "active"
          ? "Active"
          : member?.membershipStatus || "Active",
    userId:
      member?.userId ||
      member?.id ||
      member?._id ||
      null,
    membershipId: member?.membershipId || null,
  };
}

// =========================================================
// PROFILE COMPONENT
// =========================================================
function Profile({
  currentUser = null,
  workspaceName = "CollabBoard",
  onUpdateProfile,
}) {
  // =========================================================
  // PROFILE DATA
  // =========================================================
  const [profile, setProfile] = useState(
    () => buildProfile(currentUser, workspaceName)
  );

  // =========================================================
  // UI STATE
  // =========================================================
  const [profileImage, setProfileImage] = useState(null);
  const [personalOpen, setPersonalOpen] = useState(true);
  const [contactOpen, setContactOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState(null);
  const [editingSection, setEditingSection] = useState(null);

  // =========================================================
  // EDIT DATA
  // =========================================================
  const [editData, setEditData] = useState(() => ({
    ...buildProfile(currentUser, workspaceName),
    currentPassword: "",
  }));

  // =========================================================
  // SYNC WITH APP.JSX
  // =========================================================
  //
  // Synchronize profile data when the current user or workspace
  // changes. Schedule the state updates so they don't occur
  // synchronously inside the effect body. Clean up the pending
  // callback if the component unmounts or its inputs change.
  //
  // =========================================================
  useEffect(() => {
    const updatedProfile = buildProfile(
      currentUser,
      workspaceName
    );

    const timeoutId = window.setTimeout(() => {
      setProfile(updatedProfile);
      setEditData({
        ...updatedProfile,
        currentPassword: "",
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [currentUser, workspaceName]);

  // =========================================================
  // PROFILE IMAGE
  // =========================================================
  function handleProfileImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const imageURL = URL.createObjectURL(file);
    setProfileImage(imageURL);
  }

  // =========================================================
  // START EDITING
  // =========================================================
  function startEditing(section) {
    setEditData({
      ...profile,
      currentPassword: "",
    });

    setEditingSection(section);
    setActiveMenu(null);
  }

  // =========================================================
  // INPUT CHANGE
  // =========================================================
  function handleEditChange(e) {
    const { name, value } = e.target;

    setEditData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  // =========================================================
  // SAVE CHANGES
  // =========================================================
  function saveChanges() {
    const nextProfile = {
      ...profile,
      ...editData,
    };

    if (
      typeof onUpdateProfile === "function" &&
      currentUser
    ) {
      const updatedMember = {
        ...currentUser,
        name: editData.name.trim(),
        age: editData.age,
        gender: editData.gender,
        projectRole: editData.projectRole.trim(),
        currentJob: editData.currentJob.trim(),
        email: editData.email
          .trim()
          .toLowerCase(),
        bio: editData.bio.trim(),
        phone: editData.phone.trim(),
        location: editData.location.trim(),
        timeZone: editData.timeZone.trim(),
        currentPassword:
          editData.currentPassword || "",
      };

      onUpdateProfile(updatedMember);
    }

    setProfile(nextProfile);

    setEditData({
      ...nextProfile,
      currentPassword: "",
    });

    setEditingSection(null);
    setActiveMenu(null);
  }

  // =========================================================
  // CANCEL EDITING
  // =========================================================
  function cancelEditing() {
    setEditData({
      ...profile,
      currentPassword: "",
    });

    setEditingSection(null);
    setActiveMenu(null);
  }

  // =========================================================
  // MENU
  // =========================================================
  function toggleMenu(section) {
    setActiveMenu((current) =>
      current === section ? null : section
    );
  }

  // =========================================================
  // INITIALS
  // =========================================================
  function getInitials(name) {
    if (!name) {
      return "TM";
    }

    return name
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  // =========================================================
  // STATUS HELPERS
  // =========================================================
  function getProfilePresence() {
    return profile.userId
      ? "Online Member"
      : "Offline Member";
  }

  function getProfileAccountStatus() {
    const normalized = String(
      profile.accountStatus || ""
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");

    if (
      normalized === "non-active" ||
      normalized === "nonactive"
    ) {
      return "Non-Active";
    }

    return "Active";
  }

  function getProfileMembershipStatus() {
    const normalized = String(
      profile.membershipStatus || ""
    )
      .trim()
      .toLowerCase();

    return normalized === "inactive"
      ? "Inactive"
      : "Active";
  }

  // =========================================================
  // DISPLAY VALUE
  // =========================================================
  function displayValue(value) {
    return value || "Not provided";
  }

  // =========================================================
  // RENDER
  // =========================================================
  return (
    <div className="profile-page">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="profile-page-header">
        <div>
          <p className="profile-page-label">
            ACCOUNT
          </p>

          <h1>
            Profile
          </h1>

          <p className="profile-page-subtitle">
            Manage your personal information
            and workspace identity.
          </p>
        </div>
      </div>

      {/* =====================================================
          PROFILE HEADER CARD
      ===================================================== */}
      <div className="profile-hero-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="profile-avatar-image"
              />
            ) : (
              <div className="profile-avatar">
                {getInitials(profile.name)}
              </div>
            )}

            <label
              className="profile-camera-button"
              title="Change profile picture"
            >
              📷

              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                hidden
              />
            </label>
          </div>
        </div>

        <div className="profile-hero-info">
          <h2>
            {profile.name}
          </h2>

          <span className="profile-role-badge">
            {profile.role}
          </span>

          <p>
            {displayValue(profile.email)}
          </p>

          <p className="profile-member-since">
            Member since{" "}
            {profile.memberSince}
          </p>
        </div>
      </div>
            {/* =====================================================
          INFORMATION GRID
      ===================================================== */}
      <div className="profile-information-grid">
        {/* ===================================================
            PERSONAL INFORMATION
        =================================================== */}
        <section
          className={`profile-information-card ${
            !personalOpen
              ? "profile-card-collapsed"
              : ""
          }`}
        >
          <div className="profile-card-header">
            <div className="profile-card-title">
              <div className="profile-card-icon personal">
                👤
              </div>

              <div>
                <h2>
                  Personal Information
                </h2>

                <p>
                  Your personal details
                </p>
              </div>
            </div>

            <div className="profile-card-actions">
              <button
                type="button"
                className="profile-collapse-button"
                onClick={() =>
                  setPersonalOpen((current) => !current)
                }
              >
                {personalOpen ? "Collapse" : "Expand"}
              </button>

              <div className="profile-menu-wrapper">
                <button
                  type="button"
                  className="profile-menu-button"
                  onClick={() =>
                    toggleMenu("personal")
                  }
                  aria-label="Personal information menu"
                >
                  ⋮
                </button>

                {activeMenu === "personal" && (
                  <div className="profile-dropdown-menu">
                    <button
                      type="button"
                      onClick={() =>
                        startEditing("personal")
                      }
                    >
                      <span>
                        🖋
                      </span>
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {personalOpen && (
            <div className="profile-card-content">
              {editingSection === "personal" ? (
                <>
                  <div className="profile-edit-grid">
                    <div className="profile-field">
                      <label>
                        Full Name
                      </label>

                      <input
                        type="text"
                        name="name"
                        value={editData.name}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="profile-field">
                      <label>
                        Age
                      </label>

                      <input
                        type="number"
                        min="1"
                        max="120"
                        name="age"
                        value={editData.age}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="profile-field">
                      <label>
                        Gender
                      </label>

                      <select
                        name="gender"
                        value={editData.gender}
                        onChange={handleEditChange}
                      >
                        <option value="">
                          Select gender
                        </option>

                        <option value="Male">
                          Male
                        </option>

                        <option value="Female">
                          Female
                        </option>

                        <option value="Other">
                          Other
                        </option>

                        <option value="Prefer not to say">
                          Prefer not to say
                        </option>
                      </select>
                    </div>

                    <div className="profile-field">
                      <label>
                        Project Role
                      </label>

                      <input
                        type="text"
                        name="projectRole"
                        value={editData.projectRole}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="profile-field profile-field-full">
                      <label>
                        Current Job
                      </label>

                      <input
                        type="text"
                        name="currentJob"
                        value={editData.currentJob}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>

                  <div className="profile-edit-actions">
                    <button
                      type="button"
                      className="profile-cancel-button"
                      onClick={cancelEditing}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="profile-save-button"
                      onClick={saveChanges}
                    >
                      Save Changes
                    </button>
                  </div>
                </>
              ) : (
                <div className="profile-details-grid">
                  <div>
                    <span>
                      Full Name
                    </span>

                    <strong>
                      {displayValue(profile.name)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Age
                    </span>

                    <strong>
                      {displayValue(profile.age)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Gender
                    </span>

                    <strong>
                      {displayValue(profile.gender)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Project Role
                    </span>

                    <strong>
                      {displayValue(profile.projectRole)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Current Job
                    </span>

                    <strong>
                      {displayValue(profile.currentJob)}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
                {/* ===================================================
            CONTACT INFORMATION
        =================================================== */}
        <section
          className={`profile-information-card ${
            !contactOpen
              ? "profile-card-collapsed"
              : ""
          }`}
        >
          <div className="profile-card-header">
            <div className="profile-card-title">
              <div className="profile-card-icon contact">
                ☎
              </div>

              <div>
                <h2>
                  Contact Information
                </h2>

                <p>
                  Your contact details
                </p>
              </div>
            </div>

            <div className="profile-card-actions">
              <button
                type="button"
                className="profile-collapse-button"
                onClick={() =>
                  setContactOpen((current) => !current)
                }
              >
                {contactOpen ? "Collapse" : "Expand"}
              </button>

              <div className="profile-menu-wrapper">
                <button
                  type="button"
                  className="profile-menu-button"
                  onClick={() =>
                    toggleMenu("contact")
                  }
                  aria-label="Contact information menu"
                >
                  ⋮
                </button>

                {activeMenu === "contact" && (
                  <div className="profile-dropdown-menu">
                    <button
                      type="button"
                      onClick={() =>
                        startEditing("contact")
                      }
                    >
                      <span>
                        🖋
                      </span>
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {contactOpen && (
            <div className="profile-card-content">
              {editingSection === "contact" ? (
                <>
                  <div className="profile-edit-grid">
                    <div className="profile-field">
                      <label>
                        Email
                      </label>

                      <input
                        type="email"
                        name="email"
                        value={editData.email}
                        onChange={handleEditChange}
                        autoComplete="email"
                      />
                    </div>

                    <div className="profile-field">
                      <label>
                        Current Password
                      </label>

                      <input
                        type="password"
                        name="currentPassword"
                        value={editData.currentPassword || ""}
                        onChange={handleEditChange}
                        autoComplete="current-password"
                        placeholder="Required only when changing email"
                      />
                    </div>

                    <div className="profile-field">
                      <label>
                        Phone
                      </label>

                      <input
                        type="text"
                        name="phone"
                        value={editData.phone}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="profile-field">
                      <label>
                        Location
                      </label>

                      <input
                        type="text"
                        name="location"
                        value={editData.location}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="profile-field">
                      <label>
                        Time Zone
                      </label>

                      <input
                        type="text"
                        name="timeZone"
                        value={editData.timeZone}
                        onChange={handleEditChange}
                        placeholder="e.g. Asia/Colombo"
                      />
                    </div>
                  </div>

                  <div className="profile-edit-actions">
                    <button
                      type="button"
                      className="profile-cancel-button"
                      onClick={cancelEditing}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="profile-save-button"
                      onClick={saveChanges}
                    >
                      Save Changes
                    </button>
                  </div>
                </>
              ) : (
                <div className="profile-details-grid">
                  <div>
                    <span>
                      Email
                    </span>

                    <strong>
                      {displayValue(profile.email)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Phone
                    </span>

                    <strong>
                      {displayValue(profile.phone)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Location
                    </span>

                    <strong>
                      {displayValue(profile.location)}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Time Zone
                    </span>

                    <strong>
                      {displayValue(profile.timeZone)}
                    </strong>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
                {/* ===================================================
            ABOUT ME
        =================================================== */}
        <section className="profile-information-card profile-about-card">
          <div className="profile-card-header">
            <div className="profile-card-title">
              <div className="profile-card-icon about">
                ✎
              </div>

              <div>
                <h2>
                  About Me
                </h2>

                <p>
                  A little about yourself
                </p>
              </div>
            </div>

            <div className="profile-card-actions">
              <div className="profile-menu-wrapper">
                <button
                  type="button"
                  className="profile-menu-button"
                  onClick={() =>
                    toggleMenu("about")
                  }
                  aria-label="About menu"
                >
                  ⋮
                </button>

                {activeMenu === "about" && (
                  <div className="profile-dropdown-menu">
                    <button
                      type="button"
                      onClick={() =>
                        startEditing("about")
                      }
                    >
                      <span>
                        🖋
                      </span>
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="profile-card-content">
            {editingSection === "about" ? (
              <>
                <div className="profile-field">
                  <label>
                    About Me
                  </label>

                  <textarea
                    name="bio"
                    value={editData.bio}
                    onChange={handleEditChange}
                    rows="5"
                  />
                </div>

                <div className="profile-edit-actions">
                  <button
                    type="button"
                    className="profile-cancel-button"
                    onClick={cancelEditing}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="profile-save-button"
                    onClick={saveChanges}
                  >
                    Save Changes
                  </button>
                </div>
              </>
            ) : (
              <p className="profile-about-text">
                {profile.bio || "No bio provided yet."}
              </p>
            )}
          </div>
        </section>

        {/* ===================================================
            WORKSPACE INFORMATION
        =================================================== */}
        <section className="profile-information-card profile-workspace-card">
          <div className="profile-card-header">
            <div className="profile-card-title">
              <div className="profile-card-icon workspace">
                ▣
              </div>

              <div>
                <h2>
                  Workspace Information
                </h2>

                <p>
                  Your current workspace
                </p>
              </div>
            </div>
          </div>

          <div className="profile-card-content">
            <div className="profile-details-grid">
              <div>
                <span>
                  Workspace
                </span>

                <strong>
                  {profile.workspace}
                </strong>
              </div>

              <div>
                <span>
                  Your Role
                </span>

                <strong>
                  {profile.role}
                </strong>
              </div>

              <div>
                <span>
                  Member Since
                </span>

                <strong>
                  {profile.memberSince}
                </strong>
              </div>

              <div>
                <span>
                  Account Status
                </span>

                <strong className="profile-status">
                  {getProfilePresence()}
                </strong>
              </div>

              <div>
                <span>
                  Account
                </span>

                <strong className="profile-status">
                  {getProfileAccountStatus()}
                </strong>
              </div>

              <div>
                <span>
                  Membership Status
                </span>

                <strong className="profile-status">
                  {getProfileMembershipStatus()}
                </strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Profile;