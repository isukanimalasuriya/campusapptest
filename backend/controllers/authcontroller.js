import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

export const register = asyncHandler(async (req, res) => {
  const { studentId, name, email, password } = req.body;

  if (!studentId || !name || !email || !password) {
    return res
      .status(400)
      .json({ message: "studentId, name, email, password are required" });
  }

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({ studentId, name, email, passwordHash });

  const token = signToken(user._id.toString());
  return res.status(201).json({
    token,
    user: {
      id: user._id,
      studentId: user.studentId,
      name: user.name,
      email: user.email,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "email and password required" });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await user.comparePassword(password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken(user._id.toString());
  return res.json({
    token,
    user: {
      id: user._id,
      studentId: user.studentId,
      name: user.name,
      email: user.email,
      role: user.role, // NEW
    },
  });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "_id studentId name email role",
  );
  if (!user) return res.status(404).json({ message: "User not found" });

  return res.json({
    user: {
      id: user._id,
      studentId: user.studentId,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

//comment
