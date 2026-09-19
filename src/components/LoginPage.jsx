import { useState } from "react";
import "./LoginPage.css";
import { BriefcaseBusiness } from "lucide-react";

function LoginPage({ onLogin, onSignUp }) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const form = e.target;
    const email = form.email.value.trim();
    const password = form.password.value.trim();

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setIsLoading(true);

    // Simulate login
    setTimeout(() => {
      onLogin();
    }, 1000);
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
    <BriefcaseBusiness size={30} strokeWidth={3.0} />
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
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <label htmlFor="password">Password</label>

            <div className="password-input">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />

              <button
                type="button"
                className="show-password"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                disabled={isLoading}
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Remember Me + Forgot Password */}
          <div className="login-options">

            <label className="remember-me">
              <input
                type="checkbox"
                disabled={isLoading}
              />

              <span>Remember me</span>
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