import { Router } from "express";
import { auth } from "../middleware/authMiddleware.js";
import { uploadSingle } from "../config/multer.js";
import {
  createGroup, getPublicGroups, getGroupById, updateGroup,
  joinGroupByCode, getMyGroups, deleteGroup, leaveGroup, getGroupMembers,
} from "../controllers/groupController.js";
import {
  getMessages, sendMessage, deleteMessage, getMessageCount,
  getResources, addResource, deleteResource,
  getAnnouncements, createAnnouncement, deleteAnnouncement,
  markAnnouncementsRead,
  markMessagesAsRead,  // ← ADD THIS IMPORT
} from "../controllers/groupDetailController.js";

const router = Router();

// In-memory typing store
const typingStore = {};

// ── Group CRUD ────────────────────────────────────────────────────────────────
router.post("/", auth, createGroup);
router.post("/join", auth, joinGroupByCode);
router.get("/my-groups", auth, getMyGroups);
router.get("/public", getPublicGroups);
router.get("/:id", getGroupById);
router.put("/:id", auth, updateGroup);
router.delete("/:id", auth, deleteGroup);
router.post("/:id/leave", auth, leaveGroup);
router.get("/:id/members", auth, getGroupMembers);

// ── Messages ──────────────────────────────────────────────────────────────────
router.get("/:id/messages", auth, getMessages);
router.get("/:id/messages/count", auth, getMessageCount);
router.post("/:id/messages", auth, uploadSingle("file"), sendMessage);
router.delete("/:id/messages/:messageId", auth, deleteMessage);
router.post('/:id/messages/read', auth, markMessagesAsRead);  // ← ADD auth middleware

// ── Typing ────────────────────────────────────────────────────────────────────
router.get("/:id/typing", auth, (req, res) => {
  const now = Date.now();
  const store = typingStore[req.params.id] || {};
  const typingUsers = Object.values(store).filter(
    (u) => now - u.timestamp < 3000
  );
  res.json({ typingUsers });
});

router.post("/:id/typing", auth, async (req, res) => {
  const { typing } = req.body;
  const { id } = req.params;
  if (!typingStore[id]) typingStore[id] = {};
  if (typing) {
    const { User } = await import("../models/user.js");
    const user = await User.findById(req.user.id).select("name");
    typingStore[id][req.user.id] = {
      userId: req.user.id,
      name: user?.name || "Someone",
      timestamp: Date.now(),
    };
  } else {
    delete typingStore[id]?.[req.user.id];
  }
  res.json({ success: true });
});

// ── Resources ─────────────────────────────────────────────────────────────────
router.get("/:id/resources", auth, getResources);
router.post("/:id/resources", auth, addResource);
router.delete("/:id/resources/:resourceId", auth, deleteResource);

// ── Announcements ─────────────────────────────────────────────────────────────
router.get("/:id/announcements", auth, getAnnouncements);
router.post("/:id/announcements", auth, createAnnouncement);
router.delete("/:id/announcements/:announcementId", auth, deleteAnnouncement);
router.post("/:id/announcements/read", auth, markAnnouncementsRead);

export default router;