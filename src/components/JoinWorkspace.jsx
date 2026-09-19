import React, { useState } from "react";
import "./JoinWorkspace.css";
import {
  BriefcaseBusiness
} from "lucide-react";

function JoinWorkspace({ onBack, onWorkspaceJoined }) {
  const [inviteCode, setInviteCode] = useState("");

  const handleJoin = (e) => {
  e.preventDefault();

  const code = inviteCode.trim().toUpperCase();

  if (!code) {
    return;
  }

  // Save the workspace code so the Team page can use it
  localStorage.setItem(
    "collabboardWorkspaceCode",
    code
  );

  if (onWorkspaceJoined) {
    onWorkspaceJoined(code);
  }
};

  return (
    <div className="join-workspace-page">
      <div className="join-workspace-overlay"></div>

      <div className="join-workspace-card">

        {/* Logo */}
        <div className="join-workspace-logo">
          <div className="join-workspace-logo-icon">
            <span><BriefcaseBusiness size={31} strokeWidth={3.0} /></span>
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
                placeholder="e.g. COLLAB-7X42K"
                value={inviteCode}
                onChange={(e) =>
                  setInviteCode(e.target.value.toUpperCase())
                }
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
          >
            <span>Join Workspace</span>
            <span className="join-workspace-arrow">→</span>
          </button>

        </form>

        {/* Back */}
        <button
          type="button"
          className="join-workspace-back"
          onClick={onBack}
        >
          <span>←</span>
          Back
        </button>

        {/* Security */}
        <div className="join-workspace-security">

          <div className="join-security-icon">
            🔒
          </div>

          <div>
            <h4>Your workspace and data are secure with us.</h4>

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