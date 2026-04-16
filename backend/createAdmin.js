// createAdmin.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { User } from "./models/user.js"; // adjust path if needed

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash("admin123", 10); // your admin password

    const admin = new User({
      studentId: "ADMIN001",
      name: "Admin User",
      email: "admin@example.com", // your admin email
      passwordHash: hashedPassword,
      role: "admin",
    });

    await admin.save();
    console.log("Admin user created!");
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

createAdmin();