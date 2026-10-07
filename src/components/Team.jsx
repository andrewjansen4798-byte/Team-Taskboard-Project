import React, { useMemo, useState } from "react";
import "./Team.css";

function Team({
  workspaceName = "Data Science Team",
  workspaceCode: workspaceCodeProp = null,

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
     SAFE LOCAL STORAGE HELPERS
  ========================================================= */

  function getStoredWorkspaceCode() {
    try {
      return (
        localStorage.getItem("collabboardWorkspaceCode") || ""
      ).trim();
    } catch (error) {
      console.error(
        "Unable to read workspace code from localStorage:",
        error
      );

      return "";
    }
  }

  /* =========================================================
     WORKSPACE CODE
     
     Prefer a workspaceCode prop when App.jsx provides one.
     Otherwise fall back to localStorage.
  ========================================================= */

  const workspaceCode =
    typeof workspaceCodeProp === "string" &&
    workspaceCodeProp.trim()
      ? workspaceCodeProp.trim()
      : getStoredWorkspaceCode() || "------";

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
     ROLE HELPERS
  ========================================================= */

  function normalizeRole(role) {
    return String(role || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function isLeaderRole(role) {
    const normalizedRole = normalizeRole(role);

    return (
      normalizedRole === "leader" ||
      normalizedRole === "team leader"
    );
  }

  /* =========================================================
     MEMBER ID HELPER
  ========================================================= */

  function getMemberId(member) {
    if (!member) {
      return null;
    }

    return (
      member.id ??
      member._id ??
      member.userId ??
      member.user?._id ??
      member.user?.id ??
      null
    );
  }

  /* =========================================================
     FIND CURRENT USER'S MEMBER RECORD
  ========================================================= */

  const currentUserMember = useMemo(() => {
    if (!Array.isArray(members) || !members.length) {
      return null;
    }

    if (currentUser) {
      const currentUserId = getMemberId(currentUser);

      if (currentUserId !== null && currentUserId !== undefined) {
        const matchingMember = members.find((member) => {
          const memberId = getMemberId(member);

          return (
            memberId !== null &&
            memberId !== undefined &&
            String(memberId) === String(currentUserId)
          );
        });

        if (matchingMember) {
          return matchingMember;
        }
      }
    }

    return (
      members.find(
        (member) => member?.isCurrentUser === true
      ) || null
    );
  }, [members, currentUser]);

  /* =========================================================
     CURRENT USER / ROLE

     Merge account-level information with the workspace member
     record so workspace-specific role/profile fields are not lost.
  ========================================================= */

  const activeCurrentUser = useMemo(() => {
    if (!currentUser && !currentUserMember) {
      return null;
    }

    if (!currentUserMember) {
      return currentUser;
    }

    if (!currentUser) {
      return currentUserMember;
    }

    return {
      ...currentUserMember,
      ...currentUser,

      role:
        currentUser.role ??
        currentUserMember.role,

      projectRole:
        currentUser.projectRole ??
        currentUserMember.projectRole,

      currentJob:
        currentUser.currentJob ??
        currentUserMember.currentJob,

      joined:
        currentUser.joined ??
        currentUserMember.joined,

      status:
        currentUser.status ??
        currentUserMember.status,

      bio:
        currentUser.bio ??
        currentUserMember.bio,

      age:
        currentUser.age ??
        currentUserMember.age,

      gender:
        currentUser.gender ??
        currentUserMember.gender,

      email:
        currentUser.email ??
        currentUserMember.email,

      name:
        currentUser.name ??
        currentUserMember.name,
    };
  }, [currentUser, currentUserMember]);

  const isTeamLeader = isLeaderRole(
    activeCurrentUser?.role
  );

  const currentUserId = getMemberId(
    activeCurrentUser
  );

  /* =========================================================
     CHECK WHETHER MEMBER IS CURRENT USER
  ========================================================= */

  function isCurrentUserMember(member) {
    if (!member) {
      return false;
    }

    if (member.isCurrentUser === true) {
      return true;
    }

    const memberId = getMemberId(member);

    if (
      currentUserId === null ||
      currentUserId === undefined ||
      memberId === null ||
      memberId === undefined
    ) {
      return false;
    }

    return (
      String(memberId) === String(currentUserId)
    );
  }

  /* =========================================================
     DISPLAY HELPERS
  ========================================================= */

  function getMemberName(member) {
    const name = String(member?.name || "").trim();

    return name || "Unnamed Member";
  }

  function getMemberInitials(member) {
    const name = getMemberName(member);

    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return initials || "TM";
  }

  function getMemberRole(member) {
    return member?.role || "Member";
  }

  function getMemberProjectRole(member) {
    return member?.projectRole || "Not provided";
  }

  function getMemberStatus(member) {
    return member?.status || "Active";
  }

  function getMemberJoined(member) {
    return member?.joined || "Recently";
  }

  function getMemberKey(member, index) {
    const memberId = getMemberId(member);

    if (
      memberId !== null &&
      memberId !== undefined
    ) {
      return String(memberId);
    }

    const email = String(
      member?.email || ""
    )
      .trim()
      .toLowerCase();

    if (email) {
      return `email-${email}`;
    }

    return `member-${index}`;
  }

  /* =========================================================
     SELECTED MEMBER

     Never resolve a member when there is no selected ID.
  ========================================================= */

  const selectedMember = useMemo(() => {
    if (
      selectedMemberId === null ||
      selectedMemberId === undefined
    ) {
      return null;
    }

    return (
      members.find((member) => {
        const memberId = getMemberId(member);

        if (
          memberId === null ||
          memberId === undefined
        ) {
          return false;
        }

        return (
          String(memberId) ===
          String(selectedMemberId)
        );
      }) || null
    );
  }, [members, selectedMemberId]);

  /* =========================================================
     FORM DATA
  ========================================================= */

  const [formData, setFormData] = useState({
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

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  /* =========================================================
     NORMALIZE FORM DATA
  ========================================================= */

  function buildNormalizedProfileData() {
    const normalizedAge =
      formData.age === ""
        ? ""
        : Number(formData.age);

    return {
      name: formData.name.trim(),
      age:
        normalizedAge === "" ||
        Number.isNaN(normalizedAge)
          ? ""
          : normalizedAge,
      gender: formData.gender,
      projectRole: formData.projectRole.trim(),
      currentJob: formData.currentJob.trim(),
      email: formData.email.trim(),
      bio: formData.bio.trim(),
    };
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
    setSelectedMemberId(null);
    resetForm();
    setShowMemberForm(true);
  }

  /* =========================================================
     OPEN EDIT MEMBER
     TEAM LEADER ONLY FOR OTHER MEMBERS
  ========================================================= */

  function handleOpenEditMember(member) {
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
      name: member?.name || "",
      age:
        member?.age === null ||
        member?.age === undefined
          ? ""
          : member.age,
      gender: member?.gender || "",
      projectRole: member?.projectRole || "",
      currentJob: member?.currentJob || "",
      email: member?.email || "",
      bio: member?.bio || "",
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
      name: activeCurrentUser?.name || "",
      age:
        activeCurrentUser?.age === null ||
        activeCurrentUser?.age === undefined
          ? ""
          : activeCurrentUser.age,
      gender: activeCurrentUser?.gender || "",
      projectRole:
        activeCurrentUser?.projectRole || "",
      currentJob:
        activeCurrentUser?.currentJob || "",
      email:
        activeCurrentUser?.email || "",
      bio: activeCurrentUser?.bio || "",
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
    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!name) {
      return false;
    }

    if (!email) {
      return false;
    }

    if (
      formData.age !== "" &&
      (
        Number.isNaN(Number(formData.age)) ||
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

    const profileData =
      buildNormalizedProfileData();

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
        ...profileData,
        isCurrentUser: true,
      };

      if (
        typeof onUpdateMember ===
        "function"
      ) {
        onUpdateMember(updatedMember);
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
        isCurrentUserMember(editingMember)
      ) {
        return;
      }

      const updatedMember = {
        ...editingMember,
        ...profileData,
      };

      if (
        typeof onUpdateMember ===
        "function"
      ) {
        onUpdateMember(updatedMember);
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

    const generatedId =
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID ===
        "function"
        ? crypto.randomUUID()
        : `member-${Date.now()}`;

    const newMember = {
      id: generatedId,
      ...profileData,
      role: "Member",
      status: "Active",
      joined: new Date().toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      ),
      isCurrentUser: false,
    };

    if (
      typeof onAddMember ===
      "function"
    ) {
      onAddMember(newMember);
    }

    closeMemberModal();
  }

  /* =========================================================
     DELETE MEMBER
     TEAM LEADER ONLY
  ========================================================= */

  function handleDeleteMember(member) {
    if (!isTeamLeader) {
      return;
    }

    if (
      !member ||
      isCurrentUserMember(member)
    ) {
      return;
    }

    const memberName =
      getMemberName(member);

    const confirmed = window.confirm(
      `Are you sure you want to remove ${memberName} from the team?`
    );

    if (!confirmed) {
      return;
    }

    const memberId = getMemberId(member);

    if (
      memberId === null ||
      memberId === undefined
    ) {
      console.error(
        "Unable to delete member because no member ID was found."
      );

      return;
    }

    if (
      typeof onDeleteMember ===
      "function"
    ) {
      onDeleteMember(memberId);
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
      workspaceCode === "------"
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
        textArea.style.top = "0";
        textArea.style.opacity = "0";

        document.body.appendChild(
          textArea
        );

        textArea.focus();
        textArea.select();

        const copied =
          document.execCommand("copy");

        document.body.removeChild(
          textArea
        );

        if (!copied) {
          throw new Error(
            "Fallback copy command failed."
          );
        }
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

  const normalizedSearchTerm =
    searchTerm.trim().toLowerCase();

  const filteredMembers = useMemo(() => {
    if (!Array.isArray(members)) {
      return [];
    }

    if (!normalizedSearchTerm) {
      return members;
    }

    return members.filter((member) => {
      const searchableText = [
        member?.name,
        member?.projectRole,
        member?.email,
        member?.currentJob,
        member?.role,
        member?.status,
      ]
        .filter(
          (value) =>
            value !== null &&
            value !== undefined
        )
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        normalizedSearchTerm
      );
    });
  }, [
    members,
    normalizedSearchTerm,
  ]);

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

          <h1>Team</h1>

          <p className="team-page-subtitle">
            Manage and connect with your team members.
          </p>
        </div>

        <div className="team-header-actions">
          <div className="team-search">
            <span aria-hidden="true">
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search members..."
              aria-label="Search team members"
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
              <span aria-hidden="true">
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
                {Array.isArray(members)
                  ? members.length
                  : 0}{" "}
                members
              </p>
            </div>
          </div>

          <div className="team-member-list">
            {filteredMembers.length > 0 ? (
              filteredMembers.map(
                (member, index) => (
                  <div
                    className="team-member-row"
                    key={getMemberKey(
                      member,
                      index
                    )}
                  >

                    {/* AVATAR */}

                    <div className="member-avatar">
                      {getMemberInitials(
                        member
                      )}
                    </div>

                    {/* MEMBER INFORMATION */}

                    <div className="member-main-info">
                      <div className="member-name-line">
                        <h3>
                          {getMemberName(
                            member
                          )}
                        </h3>

                        {isCurrentUserMember(
                          member
                        ) && (
                          <span className="you-badge">
                            YOU
                          </span>
                        )}

                        {isLeaderRole(
                          member?.role
                        ) && (
                          <span className="leader-badge">
                            TEAM LEADER
                          </span>
                        )}
                      </div>

                      <p>
                        {
                          getMemberProjectRole(
                            member
                          )
                        }

                        {" · "}

                        {getMemberRole(
                          member
                        )}
                      </p>

                      <span className="member-email">
                        {member?.email ||
                          "No email provided"}
                      </span>
                    </div>

                    {/* STATUS */}

                    <div className="member-status">
                      <div className="member-status-main">
                        <span className="status-dot"></span>

                        <span>
                          {
                            getMemberStatus(
                              member
                            )
                          }
                        </span>
                      </div>

                      <small>
                        Joined{" "}
                        {
                          getMemberJoined(
                            member
                          )
                        }
                      </small>
                    </div>

                    {/* VIEW BUTTON */}

                    <button
                      type="button"
                      className="view-member-button"
                      onClick={() => {
                        const memberId =
                          getMemberId(
                            member
                          );

                        if (
                          memberId !==
                            null &&
                          memberId !==
                            undefined
                        ) {
                          setSelectedMemberId(
                            memberId
                          );
                        }
                      }}
                    >
                      View
                    </button>
                  </div>
                )
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
              {getMemberInitials(
                activeCurrentUser
              )}
            </div>

            <h3>
              {activeCurrentUser?.name ||
                "Team Member"}
            </h3>

            <span className="my-profile-role">
              {activeCurrentUser?.role ||
                "MEMBER"}
            </span>

            <p>
              {activeCurrentUser?.projectRole ||
                "Not provided"}
            </p>

            <p>
              {activeCurrentUser?.currentJob ||
                "Not provided"}
            </p>

            <p className="profile-joined">
              Joined{" "}
              {activeCurrentUser?.joined ||
                "Recently"}
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
                {workspaceCode}
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
          onClick={closeMemberModal}
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
                onClick={closeMemberModal}
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
                <label htmlFor="team-member-name">
                  Full Name
                </label>

                <input
                  id="team-member-name"
                  type="text"
                  name="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={
                    handleInputChange
                  }
                  required
                />
              </div>

              {/* AGE + GENDER */}

              <div className="member-form-row">
                <div className="member-form-field">
                  <label htmlFor="team-member-age">
                    Age
                  </label>

                  <input
                    id="team-member-age"
                    type="number"
                    name="age"
                    min="1"
                    max="120"
                    placeholder="Enter age"
                    value={formData.age}
                    onChange={
                      handleInputChange
                    }
                  />
                </div>

                <div className="member-form-field">
                  <label htmlFor="team-member-gender">
                    Gender
                  </label>

                  <select
                    id="team-member-gender"
                    name="gender"
                    value={formData.gender}
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
                <label htmlFor="team-member-project-role">
                  Project Role
                </label>

                <input
                  id="team-member-project-role"
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
                <label htmlFor="team-member-current-job">
                  Current Job / Position
                </label>

                <input
                  id="team-member-current-job"
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
                <label htmlFor="team-member-email">
                  Email
                </label>

                <input
                  id="team-member-email"
                  type="email"
                  name="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={
                    handleInputChange
                  }
                  required
                />
              </div>

              {/* BIO */}

              <div className="member-form-field">
                <label htmlFor="team-member-bio">
                  Short Bio
                  <span>
                    Optional
                  </span>
                </label>

                <textarea
                  id="team-member-bio"
                  name="bio"
                  rows="3"
                  placeholder="Tell your team about yourself..."
                  value={formData.bio}
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
            setSelectedMemberId(null)
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
                setSelectedMemberId(null)
              }
              aria-label="Close"
            >
              ×
            </button>

            {/* AVATAR */}

            <div className="profile-modal-avatar">
              {getMemberInitials(
                selectedMember
              )}
            </div>

            <h2>
              {getMemberName(
                selectedMember
              )}
            </h2>

            <span className="profile-modal-role">
              {getMemberRole(
                selectedMember
              )}
            </span>

            {/* MEMBER DETAILS */}

            <div className="profile-details">
              <div>
                <span>
                  Project Role
                </span>

                <strong>
                  {getMemberProjectRole(
                    selectedMember
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Current Job
                </span>

                <strong>
                  {selectedMember?.currentJob ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <span>
                  Email
                </span>

                <strong>
                  {selectedMember?.email ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <span>
                  Age
                </span>

                <strong>
                  {selectedMember?.age ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <span>
                  Gender
                </span>

                <strong>
                  {selectedMember?.gender ||
                    "Not provided"}
                </strong>
              </div>

              <div>
                <span>
                  Joined
                </span>

                <strong>
                  {getMemberJoined(
                    selectedMember
                  )}
                </strong>
              </div>
            </div>

            {/* BIO */}

            {selectedMember?.bio && (
              <div className="profile-bio">
                <span>
                  About
                </span>

                <p>
                  {selectedMember.bio}
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
                  setSelectedMemberId(null);
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