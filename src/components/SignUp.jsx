import { useState } from "react";
import "./SignUp.css";
import { BriefcaseBusiness } from "lucide-react";

function SignUp({ onSignIn }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.fullName ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      alert("Please fill in all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (!formData.terms) {
      alert("Please agree to the Terms & Conditions.");
      return;
    }

    console.log("Sign Up Data:", formData);

    alert("Account created successfully!");
  };

  return (
    <div className="signup-page">

      {/* =====================================================
          SOFT BLURRED BACKGROUND
          ===================================================== */}

      <div className="signup-blur signup-blur-one"></div>
      <div className="signup-blur signup-blur-two"></div>
      <div className="signup-blur signup-blur-three"></div>

      {/* =====================================================
          SIGN UP CARD
          ===================================================== */}

      <div className="signup-card">

        {/* Logo */}
        <div className="signup-logo">

          <div className="signup-logo-icon">
  <BriefcaseBusiness size={30} strokeWidth={3.0} />
</div>

          <h1>
            Collab<span>Board</span>
          </h1>

        </div>

        {/* Subtitle */}
        <p className="signup-subtitle">
          Create your account
        </p>

        {/* ===================================================
            FORM
            =================================================== */}

        <form
          className="signup-form"
          onSubmit={handleSubmit}
        >

          {/* Full Name */}
          <div className="signup-input-group">

            <label htmlFor="fullName">
              Full Name
            </label>

            <div className="signup-input-wrapper">

              <svg
                className="signup-input-icon"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="4"
                />

                <path
                  d="M4 21C4 16.6 7.6 14 12 14C16.4 14 20 16.6 20 21"
                />
              </svg>

              <input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={handleChange}
                autoComplete="name"
                required
              />

            </div>
          </div>

          {/* Email */}
          <div className="signup-input-group">

            <label htmlFor="email">
              Email
            </label>

            <div className="signup-input-wrapper">

              <svg
                className="signup-input-icon"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="14"
                  rx="2"
                />

                <path
                  d="M3 7L12 13L21 7"
                />
              </svg>

              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />

            </div>
          </div>

          {/* Password */}
          <div className="signup-input-group">

            <label htmlFor="password">
              Password
            </label>

            <div className="signup-input-wrapper">

              <svg
                className="signup-input-icon"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="11"
                  rx="2"
                />

                <path
                  d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10"
                />
              </svg>

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="signup-password-toggle"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
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

          {/* Confirm Password */}
          <div className="signup-input-group">

            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <div className="signup-input-wrapper">

              <svg
                className="signup-input-icon"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="5"
                  y="10"
                  width="14"
                  height="11"
                  rx="2"
                />

                <path
                  d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10"
                />
              </svg>

              <input
                id="confirmPassword"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="signup-password-toggle"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showConfirmPassword
                  ? "🙈"
                  : "👁️"}
              </button>

            </div>
          </div>

          {/* =================================================
              TERMS
              ================================================= */}

          <label className="terms-row">

            <input
              type="checkbox"
              name="terms"
              checked={formData.terms}
              onChange={handleChange}
            />

            <span>
              I agree to the{" "}
              <a href="#terms">
                Terms & Conditions
              </a>{" "}
              and{" "}
              <a href="#privacy">
                Privacy Policy
              </a>
            </span>

          </label>

          {/* =================================================
              CREATE ACCOUNT
              ================================================= */}

          <button
            type="submit"
            className="create-account-button"
          >
            <span>
              Create Account
            </span>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path d="M5 12H19" />
              <path d="M13 6L19 12L13 18" />
            </svg>
          </button>

        </form>

        {/* ===================================================
            DIVIDER
            =================================================== */}

        <div className="signin-divider">

          <span></span>

          <p>or</p>

          <span></span>

        </div>

        {/* ===================================================
            LOGIN
            =================================================== */}

        <p className="signin-text">

          <span>
            Already have an account?
          </span>

          <button
            type="button"
            onClick={onSignIn}
          >
            Log In
          </button>

        </p>

        {/* ===================================================
            SECURITY
            =================================================== */}

        <div className="security-message">

          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="5"
              y="10"
              width="14"
              height="11"
              rx="2"
            />

            <path
              d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10"
            />
          </svg>

          <span>
            Your data is safe and secure with us.
          </span>

        </div>

      </div>
    </div>
  );
}

export default SignUp;