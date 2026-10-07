const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const memberRoutes = require("./routes/memberRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

// =========================================================
// MIDDLEWARE
// =========================================================

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

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
      console.log(
        `CollabBoard server running on port ${PORT}`
      );
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