import React from "react";
import "./WorkspaceSetup.css";
import {
  BriefcaseBusiness
} from "lucide-react";

function WorkspaceSetup({ onCreateWorkspace, onJoinWorkspace }) {
  return (
    <div className="workspace-page">
      <div className="workspace-overlay"></div>

      <div className="workspace-card">

        {/* Logo */}
        <div className="workspace-logo">
          <div className="workspace-logo-icon">
            <BriefcaseBusiness size={31} strokeWidth={3.0} />
          </div>
        </div>

        {/* Branding */}
        <h1 className="workspace-brand">
          Collab<span>Board</span>
        </h1>

        <p className="workspace-tagline">
          Teamwork made simple
        </p>

        {/* Welcome */}
        <div className="workspace-welcome">
          <h2>Welcome to CollabBoard! 👋</h2>

          <p>
            Let's get you started. Create a new workspace
            <br />
            or join an existing team.
          </p>
        </div>

        {/* Options */}
        <div className="workspace-options">

          {/* Create Workspace */}
          <div className="workspace-option create-option">

            <div className="workspace-option-icon">
              <span>+</span>
            </div>

            <h3>Create Workspace</h3>

            <p>
              Start a new workspace and invite
              <br />
              your team members.
            </p>

            <button
              className="workspace-button create-button"
              onClick={onCreateWorkspace}
            >
              <span>Create Workspace</span>
              <span className="workspace-arrow">→</span>
            </button>

          </div>

          {/* Join Workspace */}
          <div className="workspace-option join-option">

            <div className="workspace-option-icon join-icon">
              <span>♟</span>
            </div>

            <h3>Join Workspace</h3>

            <p>
              Join an existing workspace using
              <br />
              an invitation code.
            </p>

            <button
              className="workspace-button join-button"
              onClick={onJoinWorkspace}
            >
              <span>Join Workspace</span>
              <span className="workspace-arrow">→</span>
            </button>

          </div>

        </div>

        {/* Divider */}
        <div className="workspace-divider">
          <span></span>
          <p>or</p>
          <span></span>
        </div>

        {/* Security Message */}
        <div className="workspace-security">

          <div className="security-icon">
            🔒
          </div>

          <div>
            <h4>Your workspace and data are secure with us.</h4>
            <p>
              Your team's information is protected.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

export default WorkspaceSetup;