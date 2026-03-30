const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

async function generateTestToken() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/jatayu");
    console.log("Connected to MongoDB");

    // Get the User model
    const User = require("./src/models/User");

    // Find the citizen user
    const user = await User.findOne({ email: "uz@gmail2222.com" });
    if (!user) {
      console.log("User not found!  Users in DB:");
      const allUsers = await User.find().select("email role");
      console.log(allUsers);
      process.exit(1);
    }

    console.log("Found user:", user.email, user.role);

    // Generate JWT token
    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || "change-me",
      { expiresIn: "7d" }
    );

    console.log("\nGenerated token:");
    console.log(token);

    await mongoose.connection.close();
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

generateTestToken();
