import React, { useMemo, useState } from "react";
import "./Team.css";

function Team({
  workspaceName = "Data Science Team",

  // =========================================================
  // SHARED MEMBER DATA FROM APP.JSX
  // =========================================================

  members = [],
  currentUser = null,

  // =========================================================
  // MEMBER ACTIONS FROM APP.JSX
  // =========================================================

  onAddMember,
  onUpdateMember,
  onDeleteMember,
}) {
  /* =========================================================
     WORKSPACE CODE
  ========================================================= */

  const [workspaceCode] = useState(
    () =>
      localStorage.getItem(
        "collabboardWorkspaceCode"
      ) || "------"
  );

  /* =========================================================
     STATES
  ========================================================= */

  const [showMemberForm, setShowMemberForm] =
    useState(false);

  const [selectedMemberId, setSelectedMemberId] =
    useState(null);

  const [editingMember, setEditingMember] =
    useState(null);

  const [isEditingProfile, setIsEditingProfile] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [codeCopied, setCodeCopied] =
    useState(false);

  /* =========================================================
     CURRENT USER / ROLE
  ========================================================= */

  const activeCurrentUser =
    currentUser ||
    members.find(
      (member) => member.isCurrentUser
    ) ||
    null;

  /* =========================================================
     ROLE HELPERS
     =========================================================
     
     Backend uses:
       leader
       member

     Older/local frontend data may use:
       Team Leader
       Member

     Support both forms so the Team page works correctly
     with the backend and existing frontend data.
  ========================================================= */

  function normalizeRole(role) {
    return String(role || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function isLeaderRole(role) {
    const normalizedRole =
      normalizeRole(role);

    return (
      normalizedRole === "leader" ||
      normalizedRole === "team leader"
    );
  }

  const isTeamLeader = isLeaderRole(
    activeCurrentUser?.role
  );

  /* =========================================================
     MEMBER ID HELPER
     =========================================================
     
     Supports the different possible ID shapes used by the
     frontend/backend.
  ========================================================= */

  function getMemberId(member) {
    return (
      member?.id ??
      member?._id ??
      member?.userId ??
      member?.user?._id ??
      member?.user?.id ??
      null
    );
  }

  const currentUserId =
    getMemberId(activeCurrentUser);

  /* =========================================================
     CHECK WHETHER MEMBER IS CURRENT USER
     ========================================================= */

  function isCurrentUserMember(member) {
    if (!member) {
      return false;
    }

    if (member.isCurrentUser) {
      return true;
    }

    const memberId = getMemberId(member);

    if (!currentUserId || !memberId) {
      return false;
    }

    return (
      String(memberId) ===
      String(currentUserId)
    );
  }

  /* =========================================================
     SELECTED MEMBER
     Derive it from the shared members list so that when a
     member is edited, the View modal automatically receives
     the latest information.
  ========================================================= */

  const selectedMember = useMemo(
    () =>
      members.find(
        (member) =>
          String(getMemberId(member)) ===
          String(selectedMemberId)
      ) || null,
    [members, selectedMemberId]
  );

  /* =========================================================
     FORM DATA
  ========================================================= */

  const [formData, setFormData] =
    useState({
      name: "",
      age: "",
      gender: "",
      projectRole: "",
      currentJob: "",
      email: "",
      bio: "",
    });

  /* =========================================================
     RESET FORM
  ========================================================= */

  function resetForm() {
    setFormData({
      name: "",
      age: "",
      gender: "",
      projectRole: "",
      currentJob: "",
      email: "",
      bio: "",
    });
  }

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  function handleInputChange(e) {
    const {
      name,
      value,
    } = e.target;

    setFormData(
      (current) => ({
        ...current,
        [name]: value,
      })
    );
  }

  /* =========================================================
     OPEN ADD MEMBER
     TEAM LEADER ONLY
  ========================================================= */

  function handleOpenAddMember() {
    if (!isTeamLeader) {
      return;
    }

    setEditingMember(null);

    setIsEditingProfile(false);

    resetForm();

    setShowMemberForm(true);
  }

  /* =========================================================
     OPEN EDIT MEMBER
     TEAM LEADER ONLY FOR OTHER MEMBERS
  ========================================================= */

  function handleOpenEditMember(
    member
  ) {
    if (!isTeamLeader) {
      return;
    }

    if (
      !member ||
      isCurrentUserMember(member)
    ) {
      return;
    }

    setSelectedMemberId(null);

    setEditingMember(member);

    setIsEditingProfile(false);

    setFormData({
      name:
        member.name || "",

      age:
        member.age ?? "",

      gender:
        member.gender || "",

      projectRole:
        member.projectRole || "",

      currentJob:
        member.currentJob || "",

      email:
        member.email || "",

      bio:
        member.bio || "",
    });

    setShowMemberForm(true);
  }

  /* =========================================================
     EDIT MY PROFILE
     ALL USERS
  ========================================================= */

  function handleEditMyProfile() {
    if (!activeCurrentUser) {
      return;
    }

    setEditingMember(null);

    setFormData({
      name:
        activeCurrentUser.name ||
        "",

      age:
        activeCurrentUser.age ??
        "",

      gender:
        activeCurrentUser.gender ||
        "",

      projectRole:
        activeCurrentUser.projectRole ||
        "",

      currentJob:
        activeCurrentUser.currentJob ||
        "",

      email:
        activeCurrentUser.email ||
        "",

      bio:
        activeCurrentUser.bio ||
        "",
    });

    setIsEditingProfile(true);

    setSelectedMemberId(null);

    setShowMemberForm(true);
  }

  /* =========================================================
     CLOSE MEMBER FORM
  ========================================================= */

  function closeMemberModal() {
    setShowMemberForm(false);

    setIsEditingProfile(false);

    setEditingMember(null);

    resetForm();
  }

  /* =========================================================
     VALIDATE FORM
  ========================================================= */

  function isValidMemberForm() {
    if (!formData.name.trim()) {
      return false;
    }

    if (!formData.email.trim()) {
      return false;
    }

    if (
      formData.age !== "" &&
      (
        Number(formData.age) < 1 ||
        Number(formData.age) > 120
      )
    ) {
      return false;
    }

    return true;
  }

  /* =========================================================
     ADD / EDIT MEMBER
  ========================================================= */

  function handleMemberSubmit(e) {
    e.preventDefault();

    if (!isValidMemberForm()) {
      return;
    }

    /* =======================================================
       EDIT CURRENT USER
       ALL USERS CAN EDIT THEIR OWN PROFILE
    ======================================================= */

    if (isEditingProfile) {
      if (!activeCurrentUser) {
        return;
      }

      const updatedMember = {
        ...activeCurrentUser,

        name:
          formData.name.trim(),

        age:
          formData.age,

        gender:
          formData.gender,

        projectRole:
          formData.projectRole.trim(),

        currentJob:
          formData.currentJob.trim(),

        email:
          formData.email.trim(),

        bio:
          formData.bio.trim(),

        isCurrentUser: true,
      };

      if (
        typeof onUpdateMember ===
        "function"
      ) {
        onUpdateMember(
          updatedMember
        );
      }

      closeMemberModal();

      return;
    }

    /* =======================================================
       EDIT EXISTING MEMBER
       TEAM LEADER ONLY
    ======================================================= */

    if (editingMember) {
      if (!isTeamLeader) {
        return;
      }

      if (
        isCurrentUserMember(
          editingMember
        )
      ) {
        return;
      }

      const updatedMember = {
        ...editingMember,

        name:
          formData.name.trim(),

        age:
          formData.age,

        gender:
          formData.gender,

        projectRole:
          formData.projectRole.trim(),

        currentJob:
          formData.currentJob.trim(),

        email:
          formData.email.trim(),

        bio:
          formData.bio.trim(),
      };

      if (
        typeof onUpdateMember ===
        "function"
      ) {
        onUpdateMember(
          updatedMember
        );
      }

      closeMemberModal();

      return;
    }

    /* =======================================================
       ADD NEW MEMBER
       TEAM LEADER ONLY
    ======================================================= */

    if (!isTeamLeader) {
      return;
    }

    const newMember = {
      id: Date.now(),

      name:
        formData.name.trim(),

      age:
        formData.age,

      gender:
        formData.gender,

      projectRole:
        formData.projectRole.trim(),

      currentJob:
        formData.currentJob.trim(),

      email:
        formData.email.trim(),

      bio:
        formData.bio.trim(),

      role:
        "Member",

      status:
        "Active",

      joined:
        new Date().toLocaleDateString(
          "en-US",
          {
            month:
              "short",

            day:
              "numeric",

            year:
              "numeric",
          }
        ),

      isCurrentUser:
        false,
    };

    if (
      typeof onAddMember ===
      "function"
    ) {
      onAddMember(
        newMember
      );
    }

    closeMemberModal();
  }

  /* =========================================================
     DELETE MEMBER
     TEAM LEADER ONLY
  ========================================================= */

  function handleDeleteMember(
    member
  ) {
    if (!isTeamLeader) {
      return;
    }

    if (
      !member ||
      isCurrentUserMember(member)
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to remove ${member.name} from the team?`
      );

    if (!confirmed) {
      return;
    }

    if (
      typeof onDeleteMember ===
      "function"
    ) {
      onDeleteMember(
        getMemberId(member)
      );
    }

    setSelectedMemberId(null);
  }

  /* =========================================================
     COPY WORKSPACE CODE
     ALL USERS
  ========================================================= */

  async function handleCopyInviteCode() {
    if (
      !workspaceCode ||
      workspaceCode ===
        "------"
    ) {
      return;
    }

    try {
      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(
          workspaceCode
        );
      } else {
        const textArea =
          document.createElement(
            "textarea"
          );

        textArea.value =
          workspaceCode;

        textArea.style.position =
          "fixed";

        textArea.style.left =
          "-9999px";

        textArea.style.top =
          "0";

        document.body.appendChild(
          textArea
        );

        textArea.focus();

        textArea.select();

        document.execCommand(
          "copy"
        );

        document.body.removeChild(
          textArea
        );
      }

      setCodeCopied(true);

      window.setTimeout(() => {
        setCodeCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Unable to copy workspace code:",
        error
      );

      setCodeCopied(false);
    }
  }

  /* =========================================================
     FILTER MEMBERS
  ========================================================= */

  const filteredMembers =
    members.filter(
      (member) =>
        `${member.name} ${member.projectRole} ${member.email}`
          .toLowerCase()
          .includes(
            searchTerm
              .toLowerCase()
          )
    );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="team-page">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="team-page-header">

        <div>

          <p className="team-page-label">
            TEAM WORKSPACE
          </p>

          <h1>
            Team
          </h1>

          <p className="team-page-subtitle">
            Manage and connect with your team members.
          </p>

        </div>

        <div className="team-header-actions">

          <div className="team-search">

            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
            />

          </div>

          {/* =================================================
              ADD MEMBER
              TEAM LEADER ONLY
          ================================================= */}

          {isTeamLeader && (
            <button
              type="button"
              className="add-member-button"
              onClick={
                handleOpenAddMember
              }
            >

              <span>
                +
              </span>

              Add Member

            </button>
          )}

        </div>

      </div>

      {/* ===================================================
          WORKSPACE INFORMATION
      =================================================== */}

      <div className="team-info-banner">

        <div className="team-info-icon">
          i
        </div>

        <div>

          <strong>
            {workspaceName}
          </strong>

          <p>
            {isTeamLeader
              ? "You are the Team Leader. You can add, edit, and remove team members."
              : "You can view team members and manage your own profile."}
          </p>

        </div>

      </div>

      {/* ===================================================
          MAIN TEAM CONTENT
      =================================================== */}

      <div className="team-content-grid">

        {/* =================================================
            TEAM MEMBERS
        ================================================= */}

        <div className="team-members-card">

          <div className="team-card-header">

            <div>

              <h2>
                Team Members
              </h2>

              <p>
                {members.length} members
              </p>

            </div>

          </div>

          <div className="team-member-list">

            {filteredMembers.length >
            0 ? (

              filteredMembers.map(
                (member) => {

                  const initials =
                    member.name
                      .split(" ")
                      .map(
                        (word) =>
                          word[0]
                      )
                      .join("")
                      .slice(
                        0,
                        2
                      )
                      .toUpperCase();

                  return (
                    <div
                      className="team-member-row"
                      key={
                        getMemberId(
                          member
                        )
                      }
                    >

                      {/* AVATAR */}

                      <div className="member-avatar">
                        {initials}
                      </div>

                      {/* MEMBER INFORMATION */}

                      <div className="member-main-info">

                        <div className="member-name-line">

                          <h3>
                            {member.name}
                          </h3>

                          {isCurrentUserMember(
                            member
                          ) && (
                            <span className="you-badge">
                              YOU
                            </span>
                          )}

                          {isLeaderRole(
                            member.role
                          ) && (
                            <span className="leader-badge">
                              TEAM LEADER
                            </span>
                          )}

                        </div>

                        <p>
                          {
                            member.projectRole
                          }
                          {" · "}
                          {
                            member.role
                          }
                        </p>

                        <span className="member-email">
                          {
                            member.email
                          }
                        </span>

                      </div>

                      {/* STATUS */}

                      <div className="member-status">

                        <div className="member-status-main">

                          <span className="status-dot"></span>

                          <span>
                            {
                              member.status
                            }
                          </span>

                        </div>

                        <small>
                          Joined{" "}
                          {
                            member.joined
                          }
                        </small>

                      </div>

                      {/* ONLY VIEW BUTTON */}

                      <button
                        type="button"
                        className="view-member-button"
                        onClick={() =>
                          setSelectedMemberId(
                            getMemberId(
                              member
                            )
                          )
                        }
                      >
                        View
                      </button>

                    </div>
                  );
                }
              )

            ) : (

              <div className="no-members">
                No members found.
              </div>

            )}

          </div>

          {/* FOOTER */}

          <div className="team-members-footer">

            <span>
              👥
            </span>

            <span>
              That's everyone in the team! 🎉
            </span>

          </div>

        </div>

        {/* =================================================
            RIGHT COLUMN
        ================================================= */}

        <div className="team-right-column">

          {/* =================================================
              MY PROFILE
          ================================================= */}

          <div className="team-side-card">

            <h2>
              My Profile
            </h2>

            <div className="my-profile-avatar">

              {activeCurrentUser?.name
                ? activeCurrentUser.name
                    .split(" ")
                    .map(
                      (word) =>
                        word[0]
                    )
                    .join("")
                    .slice(
                      0,
                      2
                    )
                    .toUpperCase()
                : "AT"}

            </div>

            <h3>
              {
                activeCurrentUser?.name ||
                "Team Member"
              }
            </h3>

            <span className="my-profile-role">
              {
                activeCurrentUser?.role ||
                "MEMBER"
              }
            </span>

            <p>
              {
                activeCurrentUser?.projectRole ||
                "Not provided"
              }
            </p>

            <p>
              {
                activeCurrentUser?.currentJob ||
                "Not provided"
              }
            </p>

            <p className="profile-joined">
              Joined{" "}
              {
                activeCurrentUser?.joined ||
                "Recently"
              }
            </p>

            <button
              type="button"
              className="edit-profile-button"
              onClick={
                handleEditMyProfile
              }
            >
              ♙ Edit My Profile
            </button>

          </div>

          {/* =================================================
              HELP
          ================================================= */}

          <div className="team-help-card">

            <div className="help-icon">
              👥
            </div>

            <h3>
              Why add your profile?
            </h3>

            <p>
              Adding your details helps your team
              understand your role and skills better.
              Let's build a great team together!
            </p>

          </div>

          {/* =================================================
              WORKSPACE CODE
              ALL USERS CAN COPY
          ================================================= */}

          <div className="workspace-code-card">

            <h2>
              Workspace Code
            </h2>

            <div className="workspace-code-display">

              <strong>
                {
                  workspaceCode
                }
              </strong>

              <button
                type="button"
                className={`workspace-copy-button ${
                  codeCopied
                    ? "copied"
                    : ""
                }`}
                onClick={
                  handleCopyInviteCode
                }
                title={
                  codeCopied
                    ? "Copied!"
                    : "Copy workspace code"
                }
                aria-label={
                  codeCopied
                    ? "Workspace code copied"
                    : "Copy workspace code"
                }
              >

                {codeCopied
                  ? "✓"
                  : "⧉"}

              </button>

            </div>

            <p>
              Share this code with new members so
              they can join the workspace.
            </p>

          </div>

        </div>

      </div>

      {/* =====================================================
          ADD / EDIT MEMBER MODAL
      ===================================================== */}

      {showMemberForm && (

        <div
          className="team-modal-overlay"
          onClick={
            closeMemberModal
          }
        >

          <div
            className="team-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="team-modal-header">

              <div>

                <h2>
                  {isEditingProfile
                    ? "Edit My Profile"
                    : editingMember
                      ? "Edit Member"
                      : "Add Member"}
                </h2>

                <p>
                  {isEditingProfile
                    ? "Update your profile information."
                    : editingMember
                      ? "Update this team member's full information."
                      : "Add a new member to your team."}
                </p>

              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={
                  closeMemberModal
                }
                aria-label="Close"
              >
                ×
              </button>

            </div>

            <form
              className="member-form"
              onSubmit={
                handleMemberSubmit
              }
            >

              {/* FULL NAME */}

              <div className="member-form-field">

                <label>
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  value={
                    formData.name
                  }
                  onChange={
                    handleInputChange
                  }
                />

              </div>

              {/* AGE + GENDER */}

              <div className="member-form-row">

                <div className="member-form-field">

                  <label>
                    Age
                  </label>

                  <input
                    type="number"
                    name="age"
                    min="1"
                    max="120"
                    placeholder="Enter age"
                    value={
                      formData.age
                    }
                    onChange={
                      handleInputChange
                    }
                  />

                </div>

                <div className="member-form-field">

                  <label>
                    Gender
                  </label>

                  <select
                    name="gender"
                    value={
                      formData.gender
                    }
                    onChange={
                      handleInputChange
                    }
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

              </div>

              {/* PROJECT ROLE */}

              <div className="member-form-field">

                <label>
                  Project Role
                </label>

                <input
                  type="text"
                  name="projectRole"
                  placeholder="e.g. Data Analyst, ML Engineer"
                  value={
                    formData.projectRole
                  }
                  onChange={
                    handleInputChange
                  }
                />

              </div>

              {/* CURRENT JOB */}

              <div className="member-form-field">

                <label>
                  Current Job / Position
                </label>

                <input
                  type="text"
                  name="currentJob"
                  placeholder="e.g. Undergraduate, Data Scientist"
                  value={
                    formData.currentJob
                  }
                  onChange={
                    handleInputChange
                  }
                />

              </div>

              {/* EMAIL */}

              <div className="member-form-field">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={
                    formData.email
                  }
                  onChange={
                    handleInputChange
                  }
                />

              </div>

              {/* BIO */}

              <div className="member-form-field">

                <label>
                  Short Bio
                  <span>
                    Optional
                  </span>
                </label>

                <textarea
                  name="bio"
                  rows="3"
                  placeholder="Tell your team about yourself..."
                  value={
                    formData.bio
                  }
                  onChange={
                    handleInputChange
                  }
                />

              </div>

              {/* FORM ACTIONS */}

              <div className="member-form-actions">

                <button
                  type="button"
                  className="modal-cancel-button"
                  onClick={
                    closeMemberModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-submit-button"
                >
                  {isEditingProfile
                    ? "Save Changes"
                    : editingMember
                      ? "Save Member"
                      : "Add Member"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
          VIEW MEMBER MODAL
      ===================================================== */}

      {selectedMember && (

        <div
          className="team-modal-overlay"
          onClick={() =>
            setSelectedMemberId(
              null
            )
          }
        >

          <div
            className="member-profile-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="modal-close-button"
              onClick={() =>
                setSelectedMemberId(
                  null
                )
              }
              aria-label="Close"
            >
              ×
            </button>

            {/* AVATAR */}

            <div className="profile-modal-avatar">

              {selectedMember.name
                .split(" ")
                .map(
                  (word) =>
                    word[0]
                )
                .join("")
                .slice(
                  0,
                  2
                )
                .toUpperCase()}

            </div>

            <h2>
              {
                selectedMember.name
              }
            </h2>

            <span className="profile-modal-role">
              {
                selectedMember.role
              }
            </span>

            {/* MEMBER DETAILS */}

            <div className="profile-details">

              <div>

                <span>
                  Project Role
                </span>

                <strong>
                  {
                    selectedMember.projectRole
                  }
                </strong>

              </div>

              <div>

                <span>
                  Current Job
                </span>

                <strong>
                  {
                    selectedMember.currentJob ||
                    "Not provided"
                  }
                </strong>

              </div>

              <div>

                <span>
                  Email
                </span>

                <strong>
                  {
                    selectedMember.email
                  }
                </strong>

              </div>

              <div>

                <span>
                  Age
                </span>

                <strong>
                  {
                    selectedMember.age
                  }
                </strong>

              </div>

              <div>

                <span>
                  Gender
                </span>

                <strong>
                  {
                    selectedMember.gender
                  }
                </strong>

              </div>

              <div>

                <span>
                  Joined
                </span>

                <strong>
                  {
                    selectedMember.joined
                  }
                </strong>

              </div>

            </div>

            {/* BIO */}

            {selectedMember.bio && (

              <div className="profile-bio">

                <span>
                  About
                </span>

                <p>
                  {
                    selectedMember.bio
                  }
                </p>

              </div>

            )}

            {/* =================================================
                TEAM LEADER MEMBER CONTROLS
                OTHER MEMBERS ONLY
            ================================================= */}

            {isTeamLeader &&
              !isCurrentUserMember(
                selectedMember
              ) && (

                <div className="member-profile-actions">

                  <button
                    type="button"
                    className="edit-member-button"
                    onClick={() =>
                      handleOpenEditMember(
                        selectedMember
                      )
                    }
                  >
                    Edit Member
                  </button>

                  <button
                    type="button"
                    className="delete-member-button"
                    onClick={() =>
                      handleDeleteMember(
                        selectedMember
                      )
                    }
                  >
                    Delete Member
                  </button>

                </div>

              )}

            {/* =================================================
                CURRENT USER PROFILE
                ALL USERS
            ================================================= */}

            {isCurrentUserMember(
              selectedMember
            ) && (

              <button
                type="button"
                className="modal-submit-button profile-edit-button"
                onClick={() => {

                  setSelectedMemberId(
                    null
                  );

                  handleEditMyProfile();

                }}
              >
                Edit My Profile
              </button>

            )}

          </div>

        </div>

      )}

    </div>
  );
}

export default Team;