import React, { useState } from "react";
import "./CreateWorkspace.css";

import {
  BriefcaseBusiness,
  AlignLeft,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CircleCheck,
  Copy,
  Info
} from "lucide-react";

function CreateWorkspace({ onBack, onWorkspaceCreated }) {
  const [workspaceName, setWorkspaceName] = useState("");
  const [description, setDescription] = useState("");
  const [created, setCreated] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);

  function generateInviteCode() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 5; i++) {
      code += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    return `COLLAB-${code}`;
  }

  function handleCreateWorkspace(e) {
  e.preventDefault();

  if (!workspaceName.trim()) {
    return;
  }

  const newInviteCode = generateInviteCode();

  // Save workspace code so the Team page can display it
  localStorage.setItem(
    "collabboardWorkspaceCode",
    newInviteCode
  );

  // Save workspace name as well
  localStorage.setItem(
    "collabboardWorkspaceName",
    workspaceName.trim()
  );

  setInviteCode(newInviteCode);
  setCreated(true);
}

  function handleContinue() {
  if (!inviteCode) {
    return;
  }

  // Make sure the latest values are stored
  localStorage.setItem(
    "collabboardWorkspaceCode",
    inviteCode
  );

  localStorage.setItem(
    "collabboardWorkspaceName",
    workspaceName.trim()
  );

  if (onWorkspaceCreated) {
    onWorkspaceCreated({
      name: workspaceName.trim(),
      description: description.trim(),
      inviteCode: inviteCode,
    });
  }
}

  async function handleCopyCode() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(inviteCode);
      } else {
        const textArea = document.createElement("textarea");

        textArea.value = inviteCode;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";

        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        document.execCommand("copy");

        textArea.remove();
      }

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);

    } catch (error) {
      console.error("Failed to copy invitation code:", error);
    }
  }

  /* =========================================================
     WORKSPACE CREATED
  ========================================================= */

  if (created) {
    return (
      <div className="create-workspace-page">
        <div className="create-workspace-overlay"></div>

        <div className="create-workspace-card">

          {/* Success Icon */}

          <div className="workspace-success-icon">
            <BriefcaseBusiness size={30} strokeWidth={3.0} />
          </div>

          {/* Brand */}

          <h1 className="create-workspace-brand">
            Collab<span>Board</span>
          </h1>

          <p className="create-workspace-tagline">
            Teamwork made simple
          </p>

          {/* Heading */}

          <div className="workspace-created-heading">

            <h2>
              Workspace Created!
            </h2>

            <p>
              Your workspace is ready. Share the
              <br />
              invitation code with your team members.
            </p>

          </div>

          {/* Workspace Name */}

          <div className="created-workspace-name">
            {workspaceName}
          </div>

          {/* Invitation Code */}

          <div className="invite-code-section">

            <label>
              Workspace Invitation Code
            </label>

            <div className="invite-code-box">

              <span>
                {inviteCode}
              </span>

              <button
                type="button"
                onClick={handleCopyCode}
                className="copy-code-button"
              >
                {copied ? (
                  <>
                    <CircleCheck size={15} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={15} />
                    Copy
                  </>
                )}
              </button>

            </div>

          </div>

          {/* Information */}

          <div className="invite-info-box">

            <div className="invite-info-icon">
              <Info size={15} />
            </div>

            <p>
              Anyone with this code can join your
              workspace. Only share it with your team.
            </p>

          </div>

          {/* Continue */}

          <button
            type="button"
            className="create-workspace-button"
            onClick={handleContinue}
          >
            <span>Continue to Dashboard</span>

            <ArrowRight size={20} />

          </button>

        </div>
      </div>
    );
  }

  /* =========================================================
     CREATE WORKSPACE FORM
  ========================================================= */

  return (
    <div className="create-workspace-page">

      <div className="create-workspace-overlay"></div>

      <div className="create-workspace-card">

        {/* Logo */}

        <div className="create-workspace-logo">

          <div className="create-workspace-logo-icon">
            <BriefcaseBusiness size={30} strokeWidth={4} />
          </div>

        </div>

        {/* Brand */}

        <h1 className="create-workspace-brand">
          Collab<span>Board</span>
        </h1>

        <p className="create-workspace-tagline">
          Teamwork made simple
        </p>

        {/* Heading */}

        <div className="create-workspace-heading">

          <h2>
            Create your workspace
          </h2>

          <p>
            Create a workspace to collaborate and manage tasks together.
          </p>

        </div>

        {/* Form */}

        <form
          className="create-workspace-form"
          onSubmit={handleCreateWorkspace}
        >

          {/* Workspace Name */}

          <div className="create-workspace-field">

            <label>
              Workspace Name
            </label>

            <div className="create-workspace-input-wrapper">

              <BriefcaseBusiness
                className="create-workspace-input-icon"
                size={20}
              />

              <input
                type="text"
                placeholder="e.g. Data Science Team"
                value={workspaceName}
                onChange={(e) =>
                  setWorkspaceName(e.target.value)
                }
              />

            </div>

          </div>

          {/* Description */}

          <div className="create-workspace-field">

            <label>
              Description <span>(Optional)</span>
            </label>

            <div className="create-workspace-textarea-wrapper">

              <AlignLeft
                className="create-workspace-textarea-icon"
                size={20}
              />

              <textarea
                placeholder="What is this workspace for?"
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
              />

            </div>

          </div>

          {/* Create Button */}

          <button
            type="submit"
            className="create-workspace-button"
          >

            <span>
              Create Workspace
            </span>

            <ArrowRight size={20} />

          </button>

        </form>

        {/* Back Button */}

        <button
          type="button"
          className="create-workspace-back"
          onClick={onBack}
        >

          <ArrowLeft size={16} />

          <span>
            Back
          </span>

        </button>

        {/* Security */}

        <div className="create-workspace-security">

          <div className="create-security-icon">
            <ShieldCheck size={19} />
          </div>

          <div>

            <h4>
              Your workspace is private and secure.
            </h4>

            <p>
              Only people you invite can join your workspace.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default CreateWorkspace;