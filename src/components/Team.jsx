import { useMemo, useState } from "react";
import "./Team.css";

// =========================================================
// MEMBER PRESENCE
// =========================================================
function getMemberPresence(member) {
  const userId =
    member?.userId ??
    member?.user?._id ??
    member?.user?.id ??
    null;

  return userId ? "Online Member" : "Offline Member";
}

function Team({
  workspaceName = "Data Science Team",
  workspaceCode: workspaceCodeProp = null,
  members = [],
  currentUser = null,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
}) {
  // =========================================================
  // SAFE LOCAL STORAGE HELPERS
  // =========================================================
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

  // =========================================================
  // WORKSPACE CODE
  // =========================================================
  const workspaceCode =
    typeof workspaceCodeProp === "string" &&
    workspaceCodeProp.trim()
      ? workspaceCodeProp.trim()
      : getStoredWorkspaceCode() || "------";

  // =========================================================
  // STATES
  // =========================================================
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  // =========================================================
  // FORM DATA
  // =========================================================
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    projectRole: "",
    currentJob: "",
    email: "",
    phone: "",
    location: "",
    timeZone: "",
    bio: "",
  });

  // =========================================================
  // ROLE HELPERS
  // =========================================================
  function normalizeRole(role) {
    return String(role || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function isLeaderRole(role) {
    const normalized = normalizeRole(role);

    return (
      normalized === "leader" ||
      normalized === "team leader"
    );
  }

  // =========================================================
  // MEMBERSHIP ID
  // This identifies the workspace membership record.
  // Do not use the User ID for workspace member edit/delete.
  // =========================================================
  function getMembershipId(member) {
    if (!member) {
      return null;
    }

    return (
      member.membershipId ??
      member.membership?._id ??
      member.membership?.id ??
      null
    );
  }

  // =========================================================
  // USER ID
  // Offline members do not have a registered User ID.
  // =========================================================
  function getUserId(member) {
    if (!member) {
      return null;
    }

    return (
      member.userId ??
      member.user?._id ??
      member.user?.id ??
      null
    );
  }

  // =========================================================
  // FIND CURRENT USER'S MEMBER RECORD
  // =========================================================
  const currentUserMember = useMemo(() => {
    if (!Array.isArray(members) || members.length === 0) {
      return null;
    }

    const userId =
      getUserId(currentUser) ??
      currentUser?.id ??
      currentUser?._id ??
      null;

    const email = String(currentUser?.email || "")
      .trim()
      .toLowerCase();

    // Match by registered account ID.
    if (userId !== null && userId !== undefined) {
      const byUserId = members.find((member) => {
        const memberUserId = getUserId(member);

        return (
          memberUserId !== null &&
          memberUserId !== undefined &&
          String(memberUserId) === String(userId)
        );
      });

      if (byUserId) {
        return byUserId;
      }
    }

    // Match by email.
    if (email) {
      const byEmail = members.find(
        (member) =>
          String(member?.email || "")
            .trim()
            .toLowerCase() === email
      );

      if (byEmail) {
        return byEmail;
      }
    }

    // Fallback for an explicitly marked current user.
    return (
      members.find(
        (member) => member?.isCurrentUser === true
      ) || null
    );
  }, [members, currentUser]);

  // =========================================================
  // CURRENT USER
  // Merge account-level data with workspace-specific data.
  // Workspace role and status remain workspace-scoped.
  // =========================================================
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
      ...currentUser,
      ...currentUserMember,

      id:
        currentUserMember.id ??
        currentUser.id ??
        currentUser._id,

      _id:
        currentUserMember._id ??
        currentUser._id ??
        currentUser.id,

      membershipId:
        currentUserMember.membershipId ??
        null,

      userId:
        currentUserMember.userId ??
        currentUser.id ??
        currentUser._id ??
        null,

      role:
        currentUserMember.role ??
        currentUserMember.workspaceRole ??
        currentUser.role ??
        "Member",

      workspaceRole:
        currentUserMember.workspaceRole ??
        currentUser.workspaceRole ??
        null,

      accountStatus:
        currentUserMember.accountStatus ??
        currentUser.accountStatus ??
        null,

      membershipStatus:
        currentUserMember.membershipStatus ??
        currentUser.membershipStatus ??
        null,

      name:
        currentUserMember.name ??
        currentUser.name ??
        "",

      email:
        currentUserMember.email ??
        currentUser.email ??
        "",

      age:
        currentUserMember.age ??
        currentUser.age ??
        "",

      gender:
        currentUserMember.gender ??
        currentUser.gender ??
        "",

      projectRole:
        currentUserMember.projectRole ??
        currentUser.projectRole ??
        "",

      currentJob:
        currentUserMember.currentJob ??
        currentUser.currentJob ??
        "",

      phone:
        currentUserMember.phone ??
        currentUser.phone ??
        "",

      location:
        currentUserMember.location ??
        currentUser.location ??
        "",

      timeZone:
        currentUserMember.timeZone ??
        currentUser.timeZone ??
        "",

      bio:
        currentUserMember.bio ??
        currentUser.bio ??
        "",

      joined:
        currentUserMember.joined ??
        currentUser.joined ??
        "",

      joinedAt:
        currentUserMember.joinedAt ??
        currentUser.joinedAt ??
        null,

      status:
        currentUserMember.status ??
        currentUser.status ??
        "Active",
    };
  }, [currentUser, currentUserMember]);

  // =========================================================
  // CURRENT USER ROLE
  // =========================================================
  const isTeamLeader =
    isLeaderRole(activeCurrentUser?.role) ||
    isLeaderRole(activeCurrentUser?.workspaceRole);

  const activeUserId = getUserId(activeCurrentUser);

  const activeUserEmail = String(
    activeCurrentUser?.email || ""
  )
    .trim()
    .toLowerCase();

  // =========================================================
  // CHECK WHETHER MEMBER IS CURRENT USER
  // =========================================================
  function isCurrentUserMember(member) {
    if (!member) {
      return false;
    }

    if (member.isCurrentUser === true) {
      return true;
    }

    const memberUserId = getUserId(member);

    // Match by registered account ID.
    if (
      activeUserId !== null &&
      activeUserId !== undefined &&
      memberUserId !== null &&
      memberUserId !== undefined
    ) {
      if (String(activeUserId) === String(memberUserId)) {
        return true;
      }
    }

    // Match by email.
    const memberEmail = String(member?.email || "")
      .trim()
      .toLowerCase();

    return Boolean(
      activeUserEmail &&
      memberEmail &&
      activeUserEmail === memberEmail
    );
  }

  // =========================================================
  // DISPLAY HELPERS
  // =========================================================
  function getMemberName(member) {
    return (
      String(member?.name || "").trim() ||
      "Unnamed Member"
    );
  }

  function getMemberInitials(member) {
    const initials = getMemberName(member)
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return initials || "TM";
  }

  function getMemberRole(member) {
    return (
      member?.role ||
      member?.workspaceRole ||
      "Member"
    );
  }

  function getMemberProjectRole(member) {
    return member?.projectRole || "Not provided";
  }

  // =========================================================
  // ACCOUNT STATUS
  // Active means a registered CollabBoard account.
  // Non-Active means an offline member without an account.
  // =========================================================
  function getAccountStatus(member) {
    const normalized = String(
      member?.accountStatus ??
      member?.memberStatus ??
      ""
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

    if (normalized === "active") {
      return "Active";
    }

    return getUserId(member) ? "Active" : "Non-Active";
  }

  // =========================================================
  // MEMBERSHIP STATUS
  // =========================================================
  function getMembershipStatus(member) {
    const normalized = String(
      member?.membershipStatus ??
      member?.membership?.status ??
      member?.status ??
      ""
    )
      .trim()
      .toLowerCase();

    return normalized === "inactive"
      ? "Inactive"
      : "Active";
  }

  // =========================================================
  // JOIN DATE
  // =========================================================
  function getMemberJoined(member) {
    if (member?.joined) {
      return member.joined;
    }

    if (member?.joinedAt) {
      return new Date(member.joinedAt).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        }
      );
    }

    return "Recently";
  }

  // =========================================================
  // MEMBER KEY
  // =========================================================
  function getMemberKey(member, index) {
    const membershipId = getMembershipId(member);

    if (
      membershipId !== null &&
      membershipId !== undefined
    ) {
      return String(membershipId);
    }

    const userId = getUserId(member);

    if (userId !== null && userId !== undefined) {
      return `user-${String(userId)}`;
    }

    const email = String(member?.email || "")
      .trim()
      .toLowerCase();

    if (email) {
      return `email-${email}`;
    }

    return `member-${index}`;
  }

  // =========================================================
  // SELECTED MEMBER
  // =========================================================
  const selectedMember = useMemo(() => {
    if (
      selectedMemberId === null ||
      selectedMemberId === undefined
    ) {
      return null;
    }

    return (
      members.find((member) => {
        const membershipId = getMembershipId(member);

        return (
          membershipId !== null &&
          membershipId !== undefined &&
          String(membershipId) ===
            String(selectedMemberId)
        );
      }) || null
    );
  }, [members, selectedMemberId]);

  // =========================================================
  // RESET FORM
  // =========================================================
  function resetForm() {
    setFormData({
      name: "",
      age: "",
      gender: "",
      projectRole: "",
      currentJob: "",
      email: "",
      phone: "",
      location: "",
      timeZone: "",
      bio: "",
    });
  }

  // =========================================================
  // INPUT CHANGE
  // =========================================================
  function handleInputChange(e) {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  // =========================================================
  // NORMALIZE PROFILE DATA
  // =========================================================
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
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      location: formData.location.trim(),
      timeZone: formData.timeZone.trim(),
      bio: formData.bio.trim(),
    };
  }

  // =========================================================
  // OPEN ADD MEMBER
  // TEAM LEADER ONLY
  // =========================================================
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

  // =========================================================
  // OPEN EDIT MEMBER
  // TEAM LEADER ONLY FOR OTHER MEMBERS
  // =========================================================
  function handleOpenEditMember(member) {
    if (
      !isTeamLeader ||
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
      phone: member?.phone || "",
      location: member?.location || "",
      timeZone: member?.timeZone || "",
      bio: member?.bio || "",
    });

    setShowMemberForm(true);
  }

  // =========================================================
  // EDIT MY PROFILE
  // ALL USERS
  // =========================================================
  function handleEditMyProfile() {
    if (!activeCurrentUser) {
      return;
    }

    setEditingMember(null);
    setIsEditingProfile(true);
    setSelectedMemberId(null);

    setFormData({
      name: activeCurrentUser?.name || "",

      age:
        activeCurrentUser?.age === null ||
        activeCurrentUser?.age === undefined
          ? ""
          : activeCurrentUser.age,

      gender: activeCurrentUser?.gender || "",
      projectRole: activeCurrentUser?.projectRole || "",
      currentJob: activeCurrentUser?.currentJob || "",
      email: activeCurrentUser?.email || "",
      phone: activeCurrentUser?.phone || "",
      location: activeCurrentUser?.location || "",
      timeZone: activeCurrentUser?.timeZone || "",
      bio: activeCurrentUser?.bio || "",
    });

    setShowMemberForm(true);
  }

  // =========================================================
  // CLOSE MEMBER MODAL
  // =========================================================
  function closeMemberModal() {
    setShowMemberForm(false);
    setIsEditingProfile(false);
    setEditingMember(null);
    resetForm();
  }

  // =========================================================
  // FORM VALIDATION
  // =========================================================
  function isValidMemberForm() {
    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!name || !email) {
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

  // =========================================================
  // ADD / EDIT MEMBER
  // =========================================================
  function handleMemberSubmit(e) {
    e.preventDefault();

    if (!isValidMemberForm()) {
      return;
    }

    const profileData = buildNormalizedProfileData();

    // =======================================================
    // EDIT CURRENT USER
    // ALL USERS
    // =======================================================
    if (isEditingProfile) {
      if (!activeCurrentUser) {
        return;
      }

      const updatedMember = {
        ...activeCurrentUser,
        ...profileData,

        membershipId:
          activeCurrentUser.membershipId ?? null,

        userId:
          activeCurrentUser.userId ??
          getUserId(activeCurrentUser),

        isCurrentUser: true,
      };

      if (typeof onUpdateMember === "function") {
        onUpdateMember(updatedMember);
      }

      closeMemberModal();
      return;
    }

    // =======================================================
    // EDIT OTHER MEMBER
    // TEAM LEADER ONLY
    // =======================================================
    if (editingMember) {
      if (
        !isTeamLeader ||
        isCurrentUserMember(editingMember)
      ) {
        return;
      }

      const updatedMember = {
        ...editingMember,
        ...profileData,

        membershipId:
          getMembershipId(editingMember),

        userId:
          getUserId(editingMember),
      };

      if (typeof onUpdateMember === "function") {
        onUpdateMember(updatedMember);
      }

      closeMemberModal();
      return;
    }

    // =======================================================
    // ADD NEW MEMBER
    // TEAM LEADER ONLY
    // =======================================================
    if (!isTeamLeader) {
      return;
    }

    // The backend determines whether the new member has
    // a registered CollabBoard account or is offline.
    // Do not fabricate account or membership status here.
    const newMember = {
      ...profileData,
      role: "Member",
      isCurrentUser: false,
    };

    if (typeof onAddMember === "function") {
      onAddMember(newMember);
    }

    closeMemberModal();
  }

  // =========================================================
  // DELETE MEMBER
  // TEAM LEADER ONLY
  // =========================================================
  function handleDeleteMember(member) {
    if (
      !isTeamLeader ||
      !member ||
      isCurrentUserMember(member)
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to remove ${getMemberName(
        member
      )} from the team?`
    );

    if (!confirmed) {
      return;
    }

    // Delete using the workspace membership ID.
    const membershipId = getMembershipId(member);

    if (
      membershipId === null ||
      membershipId === undefined
    ) {
      console.error(
        "Unable to delete member because no workspace membership ID was found."
      );
      return;
    }

    if (typeof onDeleteMember === "function") {
      onDeleteMember(membershipId);
    }

    setSelectedMemberId(null);
  }

  // =========================================================
  // COPY WORKSPACE CODE
  // ALL USERS
  // =========================================================
  async function handleCopyInviteCode() {
    if (!workspaceCode || workspaceCode === "------") {
      return;
    }

    try {
      // Use the modern clipboard API when available.
      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(
          workspaceCode
        );
      } else {
        // Clipboard fallback.
        const textArea = document.createElement("textarea");

        textArea.value = workspaceCode;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.style.opacity = "0";

        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        const copied = document.execCommand("copy");

        document.body.removeChild(textArea);

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

  // =========================================================
  // SEARCH FILTER
  // =========================================================
  const normalizedSearchTerm = searchTerm
    .trim()
    .toLowerCase();

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
        member?.workspaceRole,
        member?.accountStatus,
        member?.membershipStatus,
        getMemberPresence(member),
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
  }, [members, normalizedSearchTerm]);

  // =========================================================
  // MAIN UI
  // =========================================================
  return (
    <div className="team-page">
      {/* =====================================================
          HEADER
      ===================================================== */}
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
          {/* SEARCH */}
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
                setSearchTerm(e.target.value)
              }
            />
          </div>

          {/* ADD MEMBER — TEAM LEADER ONLY */}
          {isTeamLeader && (
            <button
              type="button"
              className="add-member-button"
              onClick={handleOpenAddMember}
            >
              <span aria-hidden="true">
                +
              </span>
              Add Member
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          WORKSPACE INFORMATION
      ===================================================== */}
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

      {/* =====================================================
          TEAM CONTENT
      ===================================================== */}
      <div className="team-content-grid">
        {/* ===================================================
            TEAM MEMBERS
        =================================================== */}
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
              filteredMembers.map((member, index) => (
                <div
                  className="team-member-row"
                  key={getMemberKey(member, index)}
                >
                  {/* AVATAR */}
                  <div className="member-avatar">
                    {getMemberInitials(member)}
                  </div>

                  {/* MAIN MEMBER INFO */}
                  <div className="member-main-info">
                    <div className="member-name-line">
                      <h3>
                        {getMemberName(member)}
                      </h3>

                      {/* CURRENT USER */}
                      {isCurrentUserMember(member) && (
                        <span className="you-badge">
                          YOU
                        </span>
                      )}

                      {/* TEAM LEADER */}
                      {isLeaderRole(
                        member?.role ||
                        member?.workspaceRole
                      ) && (
                        <span className="leader-badge">
                          TEAM LEADER
                        </span>
                      )}
                    </div>

                    <p>
                      {getMemberProjectRole(member)}
                      {" · "}
                      {getMemberRole(member)}
                    </p>

                    <span className="member-email">
                      {member?.email ||
                        "No email provided"}
                    </span>
                  </div>

                  {/* MEMBER STATUS */}
                  <div className="member-status">
                    <div className="member-status-main">
                      <span className="status-dot"></span>

                      <span>
                        {getMemberPresence(member)}
                      </span>
                    </div>

                    <small>
                      Account:{" "}
                      {getAccountStatus(member)}
                    </small>

                    <small>
                      Membership:{" "}
                      {getMembershipStatus(member)}
                    </small>

                    <small>
                      Joined{" "}
                      {getMemberJoined(member)}
                    </small>
                  </div>

                  {/* VIEW */}
                  <button
                    type="button"
                    className="view-member-button"
                    onClick={() => {
                      const membershipId =
                        getMembershipId(member);

                      if (
                        membershipId !== null &&
                        membershipId !== undefined
                      ) {
                        setSelectedMemberId(membershipId);
                      }
                    }}
                  >
                    View
                  </button>
                </div>
              ))
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

        {/* ===================================================
            RIGHT COLUMN
        =================================================== */}
        <div className="team-right-column">
          {/* MY PROFILE */}
          <div className="team-side-card">
            <h2>
              My Profile
            </h2>

            <div className="my-profile-avatar">
              {getMemberInitials(activeCurrentUser)}
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
              onClick={handleEditMyProfile}
            >
              ♙ Edit My Profile
            </button>
          </div>

          {/* HELP CARD */}
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

          {/* WORKSPACE CODE — ALL USERS */}
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
                  codeCopied ? "copied" : ""
                }`}
                onClick={handleCopyInviteCode}
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
                {codeCopied ? "✓" : "⧉"}
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
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
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

            {/* MEMBER FORM */}
            <form
              className="member-form"
              onSubmit={handleMemberSubmit}
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
                  onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
                  value={formData.projectRole}
                  onChange={handleInputChange}
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
                  value={formData.currentJob}
                  onChange={handleInputChange}
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
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* PHONE */}
              <div className="member-form-field">
                <label htmlFor="team-member-phone">
                  Phone
                </label>

                <input
                  id="team-member-phone"
                  type="tel"
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              {/* LOCATION */}
              <div className="member-form-field">
                <label htmlFor="team-member-location">
                  Location
                </label>

                <input
                  id="team-member-location"
                  type="text"
                  name="location"
                  placeholder="e.g. Colombo, Sri Lanka"
                  value={formData.location}
                  onChange={handleInputChange}
                />
              </div>

              {/* TIME ZONE */}
              <div className="member-form-field">
                <label htmlFor="team-member-time-zone">
                  Time Zone
                </label>

                <input
                  id="team-member-time-zone"
                  type="text"
                  name="timeZone"
                  placeholder="e.g. Asia/Colombo"
                  value={formData.timeZone}
                  onChange={handleInputChange}
                />
              </div>

              {/* BIO */}
              <div className="member-form-field">
                <label htmlFor="team-member-bio">
                  Short Bio{" "}
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
                  onChange={handleInputChange}
                />
              </div>

              {/* FORM ACTIONS */}
              <div className="member-form-actions">
                <button
                  type="button"
                  className="modal-cancel-button"
                  onClick={closeMemberModal}
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
          onClick={() => setSelectedMemberId(null)}
        >
          <div
            className="member-profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE */}
            <button
              type="button"
              className="modal-close-button"
              onClick={() => setSelectedMemberId(null)}
              aria-label="Close"
            >
              ×
            </button>

            {/* AVATAR */}
            <div className="profile-modal-avatar">
              {getMemberInitials(selectedMember)}
            </div>

            {/* NAME */}
            <h2>
              {getMemberName(selectedMember)}
            </h2>

            {/* ROLE */}
            <span className="profile-modal-role">
              {getMemberRole(selectedMember)}
            </span>

            {/* MEMBER DETAILS */}
            <div className="profile-details">
              {/* ONLINE / OFFLINE */}
              <div>
                <span>
                  Account
                </span>

                <strong>
                  {getMemberPresence(selectedMember)}
                </strong>
              </div>

              {/* ACCOUNT STATUS */}
              <div>
                <span>
                  Account Status
                </span>

                <strong>
                  {getAccountStatus(selectedMember)}
                </strong>
              </div>

              {/* MEMBERSHIP STATUS */}
              <div>
                <span>
                  Membership
                </span>

                <strong>
                  {getMembershipStatus(selectedMember)}
                </strong>
              </div>

              {/* PROJECT ROLE */}
              <div>
                <span>
                  Project Role
                </span>

                <strong>
                  {getMemberProjectRole(selectedMember)}
                </strong>
              </div>

              {/* CURRENT JOB */}
              <div>
                <span>
                  Current Job
                </span>

                <strong>
                  {selectedMember?.currentJob ||
                    "Not provided"}
                </strong>
              </div>

              {/* EMAIL */}
              <div>
                <span>
                  Email
                </span>

                <strong>
                  {selectedMember?.email ||
                    "Not provided"}
                </strong>
              </div>

              {/* PHONE */}
              <div>
                <span>
                  Phone
                </span>

                <strong>
                  {selectedMember?.phone ||
                    "Not provided"}
                </strong>
              </div>

              {/* LOCATION */}
              <div>
                <span>
                  Location
                </span>

                <strong>
                  {selectedMember?.location ||
                    "Not provided"}
                </strong>
              </div>

              {/* TIME ZONE */}
              <div>
                <span>
                  Time Zone
                </span>

                <strong>
                  {selectedMember?.timeZone ||
                    "Not provided"}
                </strong>
              </div>

              {/* AGE */}
              <div>
                <span>
                  Age
                </span>

                <strong>
                  {selectedMember?.age ||
                    "Not provided"}
                </strong>
              </div>

              {/* GENDER */}
              <div>
                <span>
                  Gender
                </span>

                <strong>
                  {selectedMember?.gender ||
                    "Not provided"}
                </strong>
              </div>

              {/* JOINED */}
              <div>
                <span>
                  Joined
                </span>

                <strong>
                  {getMemberJoined(selectedMember)}
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

            {/* TEAM LEADER CONTROLS — OTHER MEMBERS ONLY */}
            {isTeamLeader &&
              !isCurrentUserMember(selectedMember) && (
                <div className="member-profile-actions">
                  <button
                    type="button"
                    className="edit-member-button"
                    onClick={() =>
                      handleOpenEditMember(selectedMember)
                    }
                  >
                    Edit Member
                  </button>

                  <button
                    type="button"
                    className="delete-member-button"
                    onClick={() =>
                      handleDeleteMember(selectedMember)
                    }
                  >
                    Delete Member
                  </button>
                </div>
              )}

            {/* CURRENT USER PROFILE — ALL USERS */}
            {isCurrentUserMember(selectedMember) && (
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