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
  Info,
} from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

function CreateWorkspace({ onBack, onWorkspaceCreated }) {
  const [workspaceName, setWorkspaceName] = useState("");
  const [description, setDescription] = useState("");

  const [created, setCreated] = useState(false);

  const [inviteCode, setInviteCode] = useState("");

  const [createdWorkspace, setCreatedWorkspace] =
    useState(null);

  const [copied, setCopied] = useState(false);

  const [isCreating, setIsCreating] =
    useState(false);

  const [isContinuing, setIsContinuing] =
    useState(false);

  const [error, setError] = useState("");

  // =========================================================
  // CREATE WORKSPACE
  // =========================================================
  //
  // The backend generates:
  // - workspace MongoDB ID
  // - unique join code
  // - creator membership
  // - Team Leader role
  //
  // Do NOT generate the join code in the frontend.
  //
  // =========================================================

  async function handleCreateWorkspace(e) {
    e.preventDefault();

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    const trimmedName =
      workspaceName.trim();

    const trimmedDescription =
      description.trim();

    if (!trimmedName) {
      setError(
        "Please enter a workspace name."
      );
      return;
    }

    // -------------------------------------------------------
    // GET TOKEN
    // -------------------------------------------------------

    const token =
      localStorage.getItem(
        "collabboardToken"
      );

    if (!token) {
      setError(
        "Your login session has expired. Please log in again."
      );
      return;
    }

    // -------------------------------------------------------
    // RESET STATE
    // -------------------------------------------------------

    setError("");
    setIsCreating(true);

    try {
      // -----------------------------------------------------
      // CREATE WORKSPACE THROUGH BACKEND
      // -----------------------------------------------------

      const response = await fetch(
        `${API_BASE_URL}/workspaces`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: trimmedName,
            description:
              trimmedDescription,
          }),
        }
      );

      // -----------------------------------------------------
      // READ RESPONSE
      // -----------------------------------------------------

      let data;

      try {
        data =
          await response.json();
      } catch (jsonError) {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      // -----------------------------------------------------
      // HANDLE BACKEND ERROR
      // -----------------------------------------------------

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to create the workspace."
        );
      }

      // -----------------------------------------------------
      // VALIDATE WORKSPACE RESPONSE
      // -----------------------------------------------------

      if (
        !data.workspace ||
        !data.workspace._id
      ) {
        throw new Error(
          "Workspace was created but the server did not return a valid workspace."
        );
      }

      if (
        !data.workspace.joinCode
      ) {
        throw new Error(
          "Workspace was created but no join code was returned."
        );
      }

      // -----------------------------------------------------
      // STORE REAL BACKEND WORKSPACE
      // -----------------------------------------------------

      const workspace =
        data.workspace;

      const backendWorkspaceName =
        workspace.name ||
        trimmedName;

      const backendDescription =
        workspace.description ||
        trimmedDescription;

      const backendJoinCode =
        String(
          workspace.joinCode
        )
          .trim()
          .toUpperCase();

      setCreatedWorkspace(
        workspace
      );

      setWorkspaceName(
        backendWorkspaceName
      );

      setDescription(
        backendDescription
      );

      setInviteCode(
        backendJoinCode
      );

      setCreated(true);

      // -----------------------------------------------------
      // STORE REAL WORKSPACE DATA
      // -----------------------------------------------------

      localStorage.setItem(
        "collabboardWorkspaceId",
        String(
          workspace._id
        )
      );

      localStorage.setItem(
        "collabboardWorkspaceCode",
        backendJoinCode
      );

      localStorage.setItem(
        "collabboardWorkspaceName",
        backendWorkspaceName
      );

      localStorage.setItem(
        "collabboardWorkspaceDescription",
        backendDescription
      );
    } catch (error) {
      console.error(
        "Create workspace error:",
        error
      );

      // -----------------------------------------------------
      // CONNECTION ERROR
      // -----------------------------------------------------

      if (
        error instanceof TypeError &&
        error.message
          .toLowerCase()
          .includes("fetch")
      ) {
        setError(
          "Unable to connect to the server. Please make sure the backend is running."
        );
      } else {
        setError(
          error.message ||
            "Unable to create workspace. Please try again."
        );
      }
    } finally {
      setIsCreating(false);
    }
  }

  // =========================================================
  // CONTINUE TO APPLICATION
  // =========================================================

  function handleContinue() {
    if (
      !inviteCode ||
      !createdWorkspace
    ) {
      return;
    }

    const finalName =
      workspaceName.trim();

    const finalDescription =
      description.trim();

    const finalCode =
      inviteCode
        .trim()
        .toUpperCase();

    // -------------------------------------------------------
    // SAVE LATEST VALUES
    // -------------------------------------------------------

    localStorage.setItem(
      "collabboardWorkspaceId",
      String(
        createdWorkspace._id
      )
    );

    localStorage.setItem(
      "collabboardWorkspaceCode",
      finalCode
    );

    localStorage.setItem(
      "collabboardWorkspaceName",
      finalName
    );

    localStorage.setItem(
      "collabboardWorkspaceDescription",
      finalDescription
    );

    // -------------------------------------------------------
    // PASS THE REAL BACKEND WORKSPACE TO APP
    // -------------------------------------------------------

    if (onWorkspaceCreated) {
      onWorkspaceCreated({
        ...createdWorkspace,

        // Keep this compatibility property temporarily
        // because the current App.jsx still uses inviteCode.
        inviteCode: finalCode,

        // Also expose the real backend property.
        joinCode: finalCode,

        id:
          createdWorkspace._id,

        name: finalName,

        description:
          finalDescription,
      });
    }
  }

  // =========================================================
  // COPY WORKSPACE CODE
  // =========================================================

  async function handleCopyCode() {
    try {
      if (!inviteCode) {
        return;
      }

      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {
        await navigator.clipboard.writeText(
          inviteCode
        );
      } else {
        const textArea =
          document.createElement(
            "textarea"
          );

        textArea.value =
          inviteCode;

        textArea.style.position =
          "fixed";

        textArea.style.left =
          "-999999px";

        textArea.style.top =
          "-999999px";

        document.body.appendChild(
          textArea
        );

        textArea.focus();
        textArea.select();

        document.execCommand(
          "copy"
        );

        textArea.remove();
      }

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Failed to copy workspace code:",
        error
      );
    }
  }

  // =========================================================
  // WORKSPACE CREATED SCREEN
  // =========================================================

  if (created) {
    return (
      <div className="create-workspace-page">
        <div className="create-workspace-overlay"></div>

        <div className="create-workspace-card">

          {/* Success Icon */}

          <div className="workspace-success-icon">
            <BriefcaseBusiness
              size={30}
              strokeWidth={3.0}
            />
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
              Your workspace is ready.
              Share the
              <br />
              invitation code with your
              team members.
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
                onClick={
                  handleCopyCode
                }
                className="copy-code-button"
                disabled={
                  isContinuing
                }
              >
                {copied ? (
                  <>
                    <CircleCheck
                      size={15}
                    />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy
                      size={15}
                    />
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
              Anyone with this code can
              join your workspace. Only
              share it with your team.
            </p>

          </div>

          {/* Continue */}

          <button
            type="button"
            className="create-workspace-button"
            onClick={() => {
              setIsContinuing(true);
              handleContinue();
            }}
            disabled={isContinuing}
          >
            <span>
              {isContinuing
                ? "Opening Workspace..."
                : "Continue to Dashboard"}
            </span>

            <ArrowRight
              size={20}
            />

          </button>

        </div>
      </div>
    );
  }

  // =========================================================
  // CREATE WORKSPACE FORM
  // =========================================================

  return (
    <div className="create-workspace-page">

      <div className="create-workspace-overlay"></div>

      <div className="create-workspace-card">

        {/* Logo */}

        <div className="create-workspace-logo">

          <div className="create-workspace-logo-icon">
            <BriefcaseBusiness
              size={30}
              strokeWidth={4}
            />
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
            Create a workspace to
            collaborate and manage
            tasks together.
          </p>

        </div>

        {/* Error */}

        {error && (
          <div
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "10px",
              background:
                "#fff1f2",
              color:
                "#be123c",
              fontSize:
                "13px",
              lineHeight: 1.5,
              textAlign:
                "left",
              border:
                "1px solid #fecdd3",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Form */}

        <form
          className="create-workspace-form"
          onSubmit={
            handleCreateWorkspace
          }
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
                  setWorkspaceName(
                    e.target.value
                  )
                }
                disabled={
                  isCreating
                }
                maxLength={100}
              />

            </div>

          </div>

          {/* Description */}

          <div className="create-workspace-field">

            <label>
              Description{" "}
              <span>
                (Optional)
              </span>
            </label>

            <div className="create-workspace-textarea-wrapper">

              <AlignLeft
                className="create-workspace-textarea-icon"
                size={20}
              />

              <textarea
                placeholder="What is this workspace for?"
                value={
                  description
                }
                onChange={(e) =>
                  setDescription(
                    e.target.value
                  )
                }
                disabled={
                  isCreating
                }
                maxLength={500}
              />

            </div>

          </div>

          {/* Create Button */}

          <button
            type="submit"
            className="create-workspace-button"
            disabled={
              isCreating
            }
          >
            <span>
              {isCreating
                ? "Creating Workspace..."
                : "Create Workspace"}
            </span>

            <ArrowRight
              size={20}
            />

          </button>

        </form>

        {/* Back Button */}

        <button
          type="button"
          className="create-workspace-back"
          onClick={onBack}
          disabled={
            isCreating
          }
        >
          <ArrowLeft
            size={16}
          />

          <span>
            Back
          </span>

        </button>

        {/* Security */}

        <div className="create-workspace-security">

          <div className="create-security-icon">
            <ShieldCheck
              size={19}
            />
          </div>

          <div>

            <h4>
              Your workspace is private
              and secure.
            </h4>

            <p>
              Only people you invite can
              join your workspace.
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}

export default CreateWorkspace;