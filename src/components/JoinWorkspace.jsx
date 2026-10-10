import { useState } from "react";

import "./JoinWorkspace.css";

import {
  BriefcaseBusiness,
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  LoaderCircle,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

function JoinWorkspace({ onBack, onWorkspaceJoined }) {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // =========================================================
  // JOIN WORKSPACE
  // =========================================================
  //
  // The backend is responsible for:
  // - validating the workspace code
  // - finding the workspace
  // - preventing duplicate active membership
  // - adding this user as a normal Member
  // - preserving the existing Team Leader
  //
  // The frontend must NOT create or assign workspace roles.
  // =========================================================

  async function handleJoin(e) {
    e.preventDefault();

    const code = inviteCode.trim().toUpperCase();

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (!code) {
      setError("Please enter the workspace invitation code.");
      return;
    }

    if (!/^[A-Z0-9]{8}$/.test(code)) {
      setError(
        "Please enter a valid 8-character workspace invitation code."
      );
      return;
    }

    // -------------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------------

    const token = localStorage.getItem("collabboardToken");

    if (!token) {
      setError(
        "Your login session has expired. Please log in again."
      );
      return;
    }

    setError("");
    setIsJoining(true);

    try {
      // -----------------------------------------------------
      // JOIN THROUGH BACKEND
      // -----------------------------------------------------

      const response = await fetch(
        `${API_BASE_URL}/workspaces/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            joinCode: code,
          }),
        }
      );

      // -----------------------------------------------------
      // READ RESPONSE
      // -----------------------------------------------------

      let data;

      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(
          "The server returned an invalid response.",
          { cause: jsonError }
        );
      }

      // -----------------------------------------------------
      // HANDLE BACKEND ERROR
      // -----------------------------------------------------

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to join the workspace."
        );
      }

      // -----------------------------------------------------
      // VALIDATE WORKSPACE RESPONSE
      // -----------------------------------------------------

      const workspace = data.workspace;

      if (!workspace) {
        throw new Error(
          "The server did not return workspace information."
        );
      }

      const workspaceId =
        workspace.id ||
        workspace._id ||
        "";

      if (!workspaceId) {
        throw new Error(
          "The workspace response does not contain a valid workspace ID."
        );
      }

      // -----------------------------------------------------
      // ROLE SAFETY CHECK
      // -----------------------------------------------------
      //
      // The backend must assign joiners as Member.
      // The frontend never promotes a joining user to Team Leader.
      // -----------------------------------------------------

      if (
        workspace.role &&
        workspace.role !== "member"
      ) {
        console.warn(
          "Unexpected workspace role returned while joining:",
          workspace.role
        );
      }

      // -----------------------------------------------------
      // STORE REAL WORKSPACE DETAILS
      // -----------------------------------------------------

      const normalizedCode = String(
        workspace.joinCode || code
      )
        .trim()
        .toUpperCase();

      localStorage.setItem(
        "collabboardWorkspaceId",
        String(workspaceId)
      );

      localStorage.setItem(
        "collabboardWorkspaceCode",
        normalizedCode
      );

      localStorage.setItem(
        "collabboardWorkspaceName",
        workspace.name || "CollabBoard"
      );

      localStorage.setItem(
        "collabboardWorkspaceDescription",
        workspace.description || ""
      );

      // -----------------------------------------------------
      // RETURN THE REAL BACKEND WORKSPACE TO APP
      // -----------------------------------------------------

      if (onWorkspaceJoined) {
        await onWorkspaceJoined(workspace);
      }
    } catch (joinError) {
      console.error(
        "Join workspace error:",
        joinError
      );

      if (
        joinError instanceof TypeError &&
        joinError.message.toLowerCase().includes("fetch")
      ) {
        setError(
          "Unable to connect to the server. Please make sure the backend is running."
        );
      } else {
        setError(
          joinError.message ||
            "Unable to join the workspace. Please try again."
        );
      }
    } finally {
      setIsJoining(false);
    }
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="join-workspace-page">
      <div className="join-workspace-overlay"></div>

      <div className="join-workspace-card">
        {/* Logo */}
        <div className="join-workspace-logo">
          <div className="join-workspace-logo-icon">
            <span>
              <BriefcaseBusiness
                size={31}
                strokeWidth={3}
              />
            </span>
          </div>
        </div>

        {/* Brand */}
        <h1 className="join-workspace-brand">
          Collab<span>Board</span>
        </h1>

        <p className="join-workspace-tagline">
          Teamwork made simple
        </p>

        {/* Heading */}
        <div className="join-workspace-heading">
          <h2>Join your workspace</h2>

          <p>
            Enter the invitation code shared by your
            <br />
            team leader to join the workspace.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#fff1f2",
              color: "#be123c",
              fontSize: "13px",
              lineHeight: 1.5,
              textAlign: "left",
              border: "1px solid #fecdd3",
            }}
          >
            <CircleAlert
              size={17}
              style={{
                flexShrink: 0,
                marginTop: "1px",
              }}
            />

            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form
          className="join-workspace-form"
          onSubmit={handleJoin}
        >
          <div className="join-workspace-field">
            <label htmlFor="inviteCode">
              Invitation Code
            </label>

            <div className="join-workspace-input-wrapper">
              <span className="join-workspace-input-icon">
                #
              </span>

              <input
                id="inviteCode"
                type="text"
                placeholder="e.g. 1FC894A8"
                value={inviteCode}
                onChange={(e) =>
                  setInviteCode(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                      .slice(0, 8)
                  )
                }
                disabled={isJoining}
                autoComplete="off"
                maxLength={8}
              />
            </div>
          </div>

          {/* Help */}
          <div className="join-workspace-help">
            <div className="join-help-icon">
              ?
            </div>

            <p>
              Ask your team leader for the workspace
              <br />
              invitation code.
            </p>
          </div>

          {/* Join Button */}
          <button
            type="submit"
            className="join-workspace-button"
            disabled={isJoining}
          >
            <span>
              {isJoining
                ? "Joining Workspace..."
                : "Join Workspace"}
            </span>

            {isJoining ? (
              <LoaderCircle
                size={20}
                className="join-workspace-loading-icon"
              />
            ) : (
              <ArrowRight size={20} />
            )}
          </button>
        </form>

        {/* Back */}
        <button
          type="button"
          className="join-workspace-back"
          onClick={onBack}
          disabled={isJoining}
        >
          <ArrowLeft size={16} />

          <span>Back</span>
        </button>

        {/* Security */}
        <div className="join-workspace-security">
          <div className="join-security-icon">
            🔒
          </div>

          <div>
            <h4>
              Your workspace and data are secure with us.
            </h4>

            <p>
              Only members of your workspace can access team data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoinWorkspace;