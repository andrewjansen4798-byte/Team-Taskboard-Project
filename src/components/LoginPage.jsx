import { useState } from "react";
import "./LoginPage.css";
import { BriefcaseBusiness } from "lucide-react";

const API_BASE_URL = "http://localhost:5000/api";

function LoginPage({ onLogin, onSignUp }) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.target;
    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value;

    // -------------------------------------------------------
    // CLIENT-SIDE VALIDATION
    // -------------------------------------------------------

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // -----------------------------------------------------
      // LOGIN REQUEST
      // -----------------------------------------------------

      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
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
          "The server returned an invalid response."
        );
      }

      // -----------------------------------------------------
      // HANDLE BACKEND ERROR
      // -----------------------------------------------------

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Login failed. Please check your credentials."
        );
      }

      // -----------------------------------------------------
      // VALIDATE LOGIN RESPONSE
      // -----------------------------------------------------

      if (!data.token || !data.user) {
        throw new Error(
          "Login succeeded but the server did not return valid authentication data."
        );
      }

      // -----------------------------------------------------
      // STORE AUTHENTICATION DATA
      // -----------------------------------------------------
      //
      // These keys are already used by the existing App logout
      // and account-management logic.
      //
      // -----------------------------------------------------

      localStorage.setItem(
        "collabboardToken",
        data.token
      );

      localStorage.setItem(
        "collabboardUser",
        JSON.stringify(data.user)
      );

      // -----------------------------------------------------
      // REMEMBER ME
      // -----------------------------------------------------
      //
      // The JWT itself remains valid according to the backend
      // JWT expiry. This flag is stored for frontend state
      // handling when the App is integrated.
      //
      // -----------------------------------------------------

      localStorage.setItem(
        "collabboardRememberMe",
        rememberMe ? "true" : "false"
      );

      // -----------------------------------------------------
      // LOGIN SUCCESS
      // -----------------------------------------------------
      //
      // Pass the complete authentication result to App.jsx.
      //
      // The current App can safely receive these arguments even
      // before we update its login handler.
      //
      // -----------------------------------------------------

      onLogin({
        token: data.token,
        user: data.user,
      });
    } catch (error) {
      console.error("Login error:", error);

      // -----------------------------------------------------
      // CONNECTION ERROR
      // -----------------------------------------------------

      if (
        error instanceof TypeError &&
        error.message.toLowerCase().includes("fetch")
      ) {
        setError(
          "Unable to connect to the server. Please make sure the backend is running."
        );
      } else {
        setError(
          error.message ||
            "Unable to log in. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* Soft blurred background */}
      <div className="login-blur login-blur-one"></div>
      <div className="login-blur login-blur-two"></div>
      <div className="login-blur login-blur-three"></div>

      <div className="login-card">

        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon">
            <BriefcaseBusiness
              size={30}
              strokeWidth={3.0}
            />
          </div>

          <h1>
            Collab<span>Board</span>
          </h1>
        </div>

        {/* Welcome Message */}
        <p className="login-subtitle">
          Welcome back!
          <br />
          Sign in to your team workspace
        </p>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>

          {/* Email */}
          <div className="input-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              autoComplete="email"
              required
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <label htmlFor="password">
              Password
            </label>

            <div className="password-input">
              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={isLoading}
              />

              <button
                type="button"
                className="show-password"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                disabled={isLoading}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword
                  ? "🙈"
                  : "👁️"}
              </button>
            </div>
          </div>

          {/* Remember Me + Forgot Password */}
          <div className="login-options">

            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(
                    e.target.checked
                  )
                }
                disabled={isLoading}
              />

              <span>
                Remember me
              </span>
            </label>

            <button
              type="button"
              className="forgot-password"
              disabled={isLoading}
              onClick={() =>
                alert(
                  "Password reset will be available soon."
                )
              }
            >
              Forgot password?
            </button>

          </div>

          {/* Error Message */}
          {error && (
            <p className="login-error">
              ⚠️ {error}
            </p>
          )}

          {/* Login Button */}
          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading
              ? "Logging in...⏳"
              : "Log In"}
          </button>

        </form>

        {/* Sign Up */}
        <div className="signup-prompt">
          <span>
            Don't have an account?
          </span>

          <button
            type="button"
            onClick={onSignUp}
            disabled={isLoading}
          >
            Sign Up
          </button>
        </div>

        {/* Footer */}
        <p className="login-footer">
          🔒 Authorized team members only
        </p>

      </div>
    </div>
  );
}

export default LoginPage;