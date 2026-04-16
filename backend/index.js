import "./config/env.js";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import groupRoutes from "./routes/groupRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import spaceRoutes from "./routes/spaceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import skillRoutes from "./routes/skillRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import adminTicketRoutes from "./routes/AdminticketRoutes.js";
import adminSpaceRoutes from "./routes/adminSpaceRoutes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import cors from "cors";

import http from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

const app = express();
const server = http.createServer(app);

const parseOrigins = (raw) => {
  if (!raw || raw === "*") return ["http://localhost:5173"];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const FRONTEND_ORIGINS = parseOrigins(process.env.FRONTEND_ORIGIN);

export const io = new Server(server, {
  cors: {
    origin:
      FRONTEND_ORIGINS.length === 1 ? FRONTEND_ORIGINS[0] : FRONTEND_ORIGINS,
    credentials: true,
  },
});

// Each user joins their own private room so we can send targeted events
io.on("connection", (socket) => {
  socket.on("join_user_room", (userId) => {
    if (userId) {
      socket.join(`user:${userId}`);
    }
  });
});

app.use(
  cors({
    origin:
      FRONTEND_ORIGINS.length === 1 ? FRONTEND_ORIGINS[0] : FRONTEND_ORIGINS,
    credentials: true,
  }),
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("API Running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/spaces", spaceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/admin", adminTicketRoutes);
app.use("/api/admin", adminSpaceRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
