import { Router } from "express";
import {
  getAllTickets,
  getTicketByIdAdmin,
  adminReplyToTicket,
  updateTicketStatusAdmin,
  deleteTicketAdmin,
} from "../controllers/adminTicketController.js";
import { auth } from "../middleware/authMiddleware.js";

const router = Router();

// ── Inline admin guard middleware ─────────────────────────────────────────────
// Replace this with your real isAdmin middleware if you have one.
// It assumes req.user.role === "admin" after auth runs.
const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

// All routes require auth + admin
router.use(auth, isAdmin);

router.get("/tickets", getAllTickets); // GET  /api/admin/tickets?status=active
router.get("/tickets/:id", getTicketByIdAdmin); // GET  /api/admin/tickets/:id
router.post("/tickets/:id/reply", adminReplyToTicket); // POST /api/admin/tickets/:id/reply
router.patch("/tickets/:id/status", updateTicketStatusAdmin); // PATCH /api/admin/tickets/:id/status
router.delete("/tickets/:id", deleteTicketAdmin); // DELETE /api/admin/tickets/:id

export default router;
