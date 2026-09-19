import { useEffect, useState } from "react";
import {
  ArrowDown,
  BarChart3,
  CalendarDays,
  CheckSquare,
  LogIn,
  Users,
  BriefcaseBusiness,
} from "lucide-react";
import { motion } from "framer-motion";

import "./Home.css";

import aiKanbanBoard from "../assets/ai-kanban-board.png";
import teamVideo from "../assets/team-working.mp4";

/* =========================================================
   FRAMER MOTION ANIMATION VARIANTS
   ========================================================= */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const floatAnimation = {
  y: [0, -8, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

function Home({
  onLogin,
  onRegister,
  isLoggedIn = false,
  onNewWorkspace,
  onJoinWorkspace,
}) {
  const [transition, setTransition] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);

  /* =========================================================
     GET LOGGED-IN USER
     ========================================================= */

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser =
          localStorage.getItem("collabboardUser");

        if (storedUser) {
          setLoggedInUser(JSON.parse(storedUser));
        } else {
          setLoggedInUser(null);
        }
      } catch (error) {
        console.error(
          "Unable to read logged-in user:",
          error
        );

        setLoggedInUser(null);
      }
    };

    loadUser();

    window.addEventListener(
      "collabboardAuthChanged",
      loadUser
    );

    window.addEventListener("storage", loadUser);

    return () => {
      window.removeEventListener(
        "collabboardAuthChanged",
        loadUser
      );

      window.removeEventListener(
        "storage",
        loadUser
      );
    };
  }, []);

  /* =========================================================
     USER NAME
     ========================================================= */

  const userName =
    loggedInUser?.name ||
    loggedInUser?.fullName ||
    loggedInUser?.username ||
    "there";

  /* =========================================================
     LOGIN / REGISTER TRANSITION
     ========================================================= */

  useEffect(() => {
    if (!transition) return undefined;

    const timer = window.setTimeout(() => {
      if (transition === "login") {
        onLogin();
      }

      if (transition === "register") {
        onRegister();
      }
    }, 520);

    return () => window.clearTimeout(timer);
  }, [transition, onLogin, onRegister]);

  /* =========================================================
     SCROLL REVEAL + TEAM VIDEO PLAY / PAUSE
     ========================================================= */

  useEffect(() => {
    const elements = document.querySelectorAll(".scroll-reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target;
          const video = element.querySelector("video");

          if (entry.isIntersecting) {
            element.classList.add("show");

            if (video) {
              video.play().catch(() => {});
            }
          } else {
            if (video) {
              video.pause();
            }
          }
        });
      },
      {
        threshold: 0.35,
      }
    );

    elements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  /* =========================================================
     ROUTE TRANSITION
     ========================================================= */

  const startTransition = (destination) => {
    if (!transition) {
      setTransition(destination);
    }
  };

  /* =========================================================
     SCROLL TO WORKSPACE
     ========================================================= */

  const scrollToNext = () => {
    document.querySelector("#workspace")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <motion.div
      className={`home-page ${
        transition ? "is-transitioning" : ""
      }`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* =====================================================
          HEADER
          ===================================================== */}

      <header className="home-header">
        <button
          className="home-brand"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
          aria-label="Back to top"
        >
          <span className="home-brand-mark">
            <BriefcaseBusiness
              size={27}
              strokeWidth={3.0}
            />
          </span>

          <span>
            Collab<span>Board</span>
          </span>
        </button>
      </header>

      <main>
        {/* ===================================================
            HERO SECTION
            =================================================== */}

        <section className="home-hero">
          <div className="hero-content">
            {isLoggedIn ? (
              <>
                <motion.h1 variants={fadeInUp}>
                  Welcome back, {userName}!
                </motion.h1>

                <motion.p variants={fadeInUp}>
                  Create a new workspace or join an existing
                  <br className="desktop-break" />
                  workspace to start collaborating with your team.
                </motion.p>

                <motion.div
                  className="hero-actions"
                  variants={fadeInUp}
                >
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="primary-btn"
                    onClick={onNewWorkspace}
                  >
                    New Workspace
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="secondary-btn"
                    onClick={onJoinWorkspace}
                  >
                    Join Workspace
                  </motion.button>
                </motion.div>
              </>
            ) : (
              <>
                <motion.h1 variants={fadeInUp}>
                  Work Together.
                  <br />
                  Stay Organized.
                  <br />
                  <span>Get Things Done.</span>
                </motion.h1>

                <motion.p variants={fadeInUp}>
                  CollabBoard helps teams organize tasks, track progress,
                  <br className="desktop-break" />
                  and work together in one simple workspace.
                </motion.p>

                <motion.div
                  className="hero-actions"
                  variants={fadeInUp}
                >
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="primary-btn"
                    onClick={() => startTransition("register")}
                  >
                    Get Started
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="secondary-btn"
                    onClick={() => startTransition("login")}
                  >
                    <LogIn size={18} />
                    Log In
                  </motion.button>
                </motion.div>
              </>
            )}
          </div>

          <motion.button
            variants={fadeInUp}
            whileHover={{ y: 3 }}
            className="scroll-indicator"
            onClick={scrollToNext}
          >
            <ArrowDown size={20} />
            <span>Scroll Down</span>
          </motion.button>
        </section>

        {/* ===================================================
            WORKSPACE SECTION
            =================================================== */}

        <section
          className="home-section workspace-section scroll-reveal"
          id="workspace"
        >
          <div className="section-heading">
            <span>YOUR WORKSPACE</span>
            <h2>Everything in One Place</h2>
            <p>Manage your tasks and keep your team on track.</p>
          </div>

          <motion.div
            className="image-frame scroll-reveal"
            animate={floatAnimation}
          >
            <img
              src={aiKanbanBoard}
              alt="CollabBoard Kanban board"
            />
          </motion.div>
        </section>

        {/* ===================================================
            TEAM SECTION
            =================================================== */}

        <section className="home-section team-section scroll-reveal">
          <div className="team-copy">
            <span className="section-label">TEAMWORK</span>

            <h2>Built for Teams</h2>

            <p>
              Keep everyone connected and make it easier to work toward the same
              goal.
            </p>

            <div className="team-points">
              <div>
                <Users size={20} />
                <span>Work together</span>
              </div>

              <div>
                <BarChart3 size={20} />
                <span>Track progress</span>
              </div>

              <div>
                <CheckSquare size={20} />
                <span>Stay organized</span>
              </div>
            </div>
          </div>

          {/* TEAM VIDEO */}

          <div className="image-frame team-image-frame scroll-reveal">
            <video
              className="team-video"
              src={teamVideo}
              muted
              loop
              playsInline
              preload="metadata"
            />
          </div>
        </section>

        {/* ===================================================
            FEATURES SECTION
            =================================================== */}

        <section className="home-section features-section">
          <div className="section-heading">
            <span>WHY TEAMS CHOOSE COLLABBOARD</span>
          </div>

          <motion.div
            className="feature-grid"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.2,
            }}
          >
            {/* ORGANIZE TASKS */}

            <motion.article
              variants={fadeInUp}
              whileHover={{ y: -5 }}
              className="feature-card scroll-reveal"
            >
              <div className="feature-icon feature-icon-purple">
                <CheckSquare size={32} />
              </div>

              <h3>Organize Tasks</h3>

              <p>
                Create, assign and prioritize
                <br />
                tasks with ease.
              </p>
            </motion.article>

            {/* TRACK PROGRESS */}

            <motion.article
              variants={fadeInUp}
              whileHover={{ y: -5 }}
              className="feature-card scroll-reveal"
            >
              <div className="feature-icon feature-icon-purple">
                <BarChart3 size={32} />
              </div>

              <h3>Track Progress</h3>

              <p>
                Monitor progress in real-time
                <br />
                and meet deadlines.
              </p>
            </motion.article>

            {/* WORK TOGETHER */}

            <motion.article
              variants={fadeInUp}
              whileHover={{ y: -5 }}
              className="feature-card scroll-reveal"
            >
              <div className="feature-icon feature-icon-green">
                <Users size={32} />
              </div>

              <h3>Work Together</h3>

              <p>
                Collaborate with your team
                <br />
                seamlessly.
              </p>
            </motion.article>

            {/* STAY UPDATED */}

            <motion.article
              variants={fadeInUp}
              whileHover={{ y: -5 }}
              className="feature-card scroll-reveal"
            >
              <div className="feature-icon feature-icon-orange">
                <CalendarDays size={32} />
              </div>

              <h3>Stay Updated</h3>

              <p>
                Get notified and stay updated
                <br />
                on what matters.
              </p>
            </motion.article>
          </motion.div>
        </section>
      </main>

      {/* =====================================================
          LOGIN / REGISTER TRANSITION
          ===================================================== */}

      {transition && (
        <div
          className="route-transition"
          role="status"
          aria-live="polite"
        >
          <div className="transition-card">
            <div className="transition-logo">?</div>

            <strong>
              {transition === "login"
                ? "Opening Login"
                : "Opening Register"}
            </strong>

            <span>Just a moment...</span>

            <div className="transition-line">
              <i />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default Home;