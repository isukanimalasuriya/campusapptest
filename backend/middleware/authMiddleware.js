import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

export async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("role");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = { id: payload.sub, role: user.role };
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid/expired token" });
  }
}
