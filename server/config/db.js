const mongoose = require("mongoose");

// =========================================================
// CONNECT TO MONGODB
// =========================================================

const connectDB = async () => {
  try {
    // -----------------------------------------------------
    // CHECK MONGO URI
    // -----------------------------------------------------

    if (!process.env.MONGO_URI) {
      console.error(
        "MongoDB connection failed: MONGO_URI is not defined"
      );

      process.exit(1);
    }

    // -----------------------------------------------------
    // CONNECT TO MONGODB
    // -----------------------------------------------------

    const connection = await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      `MongoDB Connected: ${connection.connection.host}`
    );
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    process.exit(1);
  }
};

module.exports = connectDB;