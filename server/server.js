const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const memberRoutes = require("./routes/memberRoutes");
const taskRoutes = require("./routes/taskRoutes");
const activityRoutes = require("./routes/activityRoutes");

const app = express();

// =========================================================
// CORS CONFIGURATION
// =========================================================

const allowedOrigins = [
  process.env.CLIENT_URL,
  "https://collabboard-sepia.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as server-to-server
      // requests and certain development tools.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked this origin: ${origin}`)
      );
    },
    credentials: true,
  })
);

// =========================================================
// MIDDLEWARE
// =========================================================

app.use(express.json());

// =========================================================
// ROOT TEST ROUTE
// =========================================================

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "CollabBoard API is running",
  });
});

// =========================================================
// AUTH ROUTES
// =========================================================

app.use("/api/auth", authRoutes);

// =========================================================
// WORKSPACE ROUTES
// =========================================================

app.use("/api/workspaces", workspaceRoutes);

// =========================================================
// MEMBER ROUTES
// =========================================================

app.use("/api/workspaces", memberRoutes);

// =========================================================
// TASK ROUTES
// =========================================================

app.use("/api/tasks", taskRoutes);

// =========================================================
// ACTIVITY ROUTES
// =========================================================

app.use("/api/activities", activityRoutes);

// =========================================================
// SERVER CONFIGURATION
// =========================================================

const PORT = Number(process.env.PORT) || 5000;

// =========================================================
// START DATABASE + SERVER
// =========================================================

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`CollabBoard server running on port ${PORT}`);
      console.log("Allowed frontend origins:", allowedOrigins);
    });
  } catch (error) {
    console.error(
      "Failed to start CollabBoard server:",
      error.message
    );

    process.exit(1);
  }
};

startServer();