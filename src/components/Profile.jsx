
import React, {
  useEffect,
  useState,
} from "react";

import "./Profile.css";

function Profile({
  currentUser = null,
  workspaceName = "CollabBoard",
  onUpdateProfile,
}) {
  // =========================================================
  // BUILD PROFILE FROM SHARED CURRENT USER
  // =========================================================

  function buildProfile(member) {
    return {
      name:
        member?.name ||
        "Team Member",

      role:
        member?.role ||
        "Member",

      email:
        member?.email ||
        "",

      phone:
        member?.phone ||
        "+94 77 123 4567",

      location:
        member?.location ||
        "Sri Lanka",

      timezone:
        member?.timezone ||
        "GMT +5:30",

      age:
        member?.age ||
        "",

      gender:
        member?.gender ||
        "",

      projectRole:
        member?.projectRole ||
        "",

      currentJob:
        member?.currentJob ||
        "",

      bio:
        member?.bio ||
        "",

      workspace:
        workspaceName ||
        "CollabBoard",

      memberSince:
        member?.joined ||
        "Recently",
    };
  }

  // =========================================================
  // PROFILE DATA
  // =========================================================

  const [profile, setProfile] =
    useState(
      () =>
        buildProfile(
          currentUser
        )
    );

  // =========================================================
  // STATES
  // =========================================================

  const [profileImage, setProfileImage] =
    useState(null);

  const [personalOpen, setPersonalOpen] =
    useState(true);

  const [contactOpen, setContactOpen] =
    useState(true);

  const [activeMenu, setActiveMenu] =
    useState(null);

  const [editingSection, setEditingSection] =
    useState(null);

  const [editData, setEditData] =
    useState(
      () =>
        buildProfile(
          currentUser
        )
    );

  // =========================================================
  // SYNC WITH APP.JSX
  // =========================================================
  //
  // When Team.jsx updates the current user, App.jsx updates
  // currentUser and passes the new object here.
  //
  // This keeps Profile synchronized with Team.

  useEffect(() => {
    const updatedProfile =
      buildProfile(
        currentUser
      );

    setProfile(
      updatedProfile
    );

    setEditData(
      updatedProfile
    );
  }, [
    currentUser,
    workspaceName,
  ]);

  // =========================================================
  // PROFILE IMAGE
  // =========================================================

  function handleProfileImageChange(e) {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    const imageURL =
      URL.createObjectURL(
        file
      );

    setProfileImage(
      imageURL
    );
  }

  // =========================================================
  // EDIT
  // =========================================================

  function startEditing(section) {
    setEditData(
      profile
    );

    setEditingSection(
      section
    );

    setActiveMenu(
      null
    );
  }

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  function handleEditChange(e) {
    const {
      name,
      value,
    } = e.target;

    setEditData(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  }

  // =========================================================
  // SAVE CHANGES
  // =========================================================

  function saveChanges() {
    const nextProfile = {
      ...profile,
      ...editData,
    };

    // -------------------------------------------------------
    // SHARED MEMBER DATA
    // -------------------------------------------------------
    //
    // These fields belong to the shared Team member object.
    // App.jsx will update teamMembers and task assignees when
    // the name changes.

    if (
      typeof onUpdateProfile ===
      "function" &&
      currentUser
    ) {
      const updatedMember = {
        ...currentUser,

        name:
          editData.name.trim(),

        age:
          editData.age,

        gender:
          editData.gender,

        projectRole:
          editData.projectRole.trim(),

        currentJob:
          editData.currentJob.trim(),

        email:
          editData.email.trim(),

        bio:
          editData.bio.trim(),
      };

      onUpdateProfile(
        updatedMember
      );
    }

    // -------------------------------------------------------
    // LOCAL PROFILE DISPLAY
    // -------------------------------------------------------
    //
    // Phone, location and timezone are currently local profile
    // fields because they do not exist in the shared member
    // model in App.jsx.

    setProfile(
      nextProfile
    );

    setEditingSection(
      null
    );

    setActiveMenu(
      null
    );
  }

  // =========================================================
  // CANCEL EDITING
  // =========================================================

  function cancelEditing() {
    setEditData(
      profile
    );

    setEditingSection(
      null
    );

    setActiveMenu(
      null
    );
  }

  // =========================================================
  // MENU
  // =========================================================

  function toggleMenu(section) {
    setActiveMenu(
      (current) =>
        current ===
        section
          ? null
          : section
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
      .split(" ")
      .filter(Boolean)
      .map(
        (word) =>
          word[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();
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
                {getInitials(
                  profile.name
                )}
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
                onChange={
                  handleProfileImageChange
                }
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
            {profile.email}
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

              {/* COLLAPSE / EXPAND */}

              <button
                type="button"
                className="profile-collapse-button"
                onClick={() =>
                  setPersonalOpen(
                    (current) =>
                      !current
                  )
                }
              >
                {personalOpen
                  ? "Collapse"
                  : "Expand"}
              </button>

              {/* THREE DOTS */}

              <div className="profile-menu-wrapper">

                <button
                  type="button"
                  className="profile-menu-button"
                  onClick={() =>
                    toggleMenu(
                      "personal"
                    )
                  }
                >
                  ⋮
                </button>

                {activeMenu ===
                  "personal" && (
                  <div className="profile-dropdown-menu">

                    <button
                      type="button"
                      onClick={() =>
                        startEditing(
                          "personal"
                        )
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

              {editingSection ===
              "personal" ? (
                <>

                  <div className="profile-edit-grid">

                    <div className="profile-field">

                      <label>
                        Full Name
                      </label>

                      <input
                        type="text"
                        name="name"
                        value={
                          editData.name
                        }
                        onChange={
                          handleEditChange
                        }
                      />

                    </div>

                    <div className="profile-field">

                      <label>
                        Age
                      </label>

                      <input
                        type="text"
                        name="age"
                        value={
                          editData.age
                        }
                        onChange={
                          handleEditChange
                        }
                      />

                    </div>

                    <div className="profile-field">

                      <label>
                        Gender
                      </label>

                      <input
                        type="text"
                        name="gender"
                        value={
                          editData.gender
                        }
                        onChange={
                          handleEditChange
                        }
                      />

                    </div>

                    <div className="profile-field">

                      <label>
                        Project Role
                      </label>

                      <input
                        type="text"
                        name="projectRole"
                        value={
                          editData.projectRole
                        }
                        onChange={
                          handleEditChange
                        }
                      />

                    </div>

                    <div className="profile-field profile-field-full">

                      <label>
                        Current Job
                      </label>

                      <input
                        type="text"
                        name="currentJob"
                        value={
                          editData.currentJob
                        }
                        onChange={
                          handleEditChange
                        }
                      />

                    </div>

                  </div>

                  <div className="profile-edit-actions">

                    <button
                      type="button"
                      className="profile-cancel-button"
                      onClick={
                        cancelEditing
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="profile-save-button"
                      onClick={
                        saveChanges
                      }
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
                      {profile.name}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Age
                    </span>

                    <strong>
                      {profile.age}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Gender
                    </span>

                    <strong>
                      {profile.gender}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Project Role
                    </span>

                    <strong>
                      {profile.projectRole}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Current Job
                    </span>

                    <strong>
                      {profile.currentJob}
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
                ✉
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

              {/* COLLAPSE / EXPAND */}

              <button
                type="button"
                className="profile-collapse-button"
                onClick={() =>
                  setContactOpen(
                    (current) =>
                      !current
                  )
                }
              >
                {contactOpen
                  ? "Collapse"
                  : "Expand"}
              </button>

              {/* THREE DOTS */}

              <div className="profile-menu-wrapper">

                <button
                  type="button"
                  className="profile-menu-button"
                  onClick={() =>
                    toggleMenu(
                      "contact"
                    )
                  }
                >
                  ⋮
                </button>

                {activeMenu ===
                  "contact" && (
                  <div className="profile-dropdown-menu">

                    <button
                      type="button"
                      onClick={() =>
                        startEditing(
                          "contact"
                        )
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

              {editingSection ===
              "contact" ? (
                <>

                  <div className="profile-edit-grid">

                    <div className="profile-field">

                      <label>
                        Email
                      </label>

                      <input
                        type="email"
                        name="email"
                        value={
                          editData.email
                        }
                        onChange={
                          handleEditChange
                        }
                      />

                    </div>

                    <div className="profile-field">

                      <label>
                        Phone
                      </label>

                      <input
                        type="text"
                        name="phone"
                        value={
                          editData.phone
                        }
                        onChange={
                          handleEditChange
                        }
                      />

                    </div>

                    <div className="profile-field">

                      <label>
                        Location
                      </label>

                      <input
                        type="text"
                        name="location"
                        value={
                          editData.location
                        }
                        onChange={
                          handleEditChange
                        }
                      />

                    </div>

                    <div className="profile-field">

                      <label>
                        Time Zone
                      </label>

                      <input
                        type="text"
                        name="timezone"
                        value={
                          editData.timezone
                        }
                        onChange={
                          handleEditChange
                        }
                      />

                    </div>

                  </div>

                  <div className="profile-edit-actions">

                    <button
                      type="button"
                      className="profile-cancel-button"
                      onClick={
                        cancelEditing
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="profile-save-button"
                      onClick={
                        saveChanges
                      }
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
                      {profile.email}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Phone
                    </span>

                    <strong>
                      {profile.phone}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Location
                    </span>

                    <strong>
                      {profile.location}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Time Zone
                    </span>

                    <strong>
                      {profile.timezone}
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
                    toggleMenu(
                      "about"
                    )
                  }
                >
                  ⋮
                </button>

                {activeMenu ===
                  "about" && (
                  <div className="profile-dropdown-menu">

                    <button
                      type="button"
                      onClick={() =>
                        startEditing(
                          "about"
                        )
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

            {editingSection ===
            "about" ? (
              <>

                <div className="profile-field">

                  <label>
                    About Me
                  </label>

                  <textarea
                    name="bio"
                    value={
                      editData.bio
                    }
                    onChange={
                      handleEditChange
                    }
                    rows="5"
                  />

                </div>

                <div className="profile-edit-actions">

                  <button
                    type="button"
                    className="profile-cancel-button"
                    onClick={
                      cancelEditing
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    className="profile-save-button"
                    onClick={
                      saveChanges
                    }
                  >
                    Save Changes
                  </button>

                </div>

              </>
            ) : (
              <p className="profile-about-text">
                {profile.bio ||
                  "No bio provided yet."}
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
                  Workspace Status
                </span>

                <strong className="profile-status">
                  Active
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