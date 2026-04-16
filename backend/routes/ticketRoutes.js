import { Router } from "express";
import { createSupportChat, sendChatMessage, updateTicketStatus, getMyTickets, getTicketById, deleteTicket } from "../controllers/ticketController.js";
import { auth } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/chat/start", auth, createSupportChat);
router.post("/chat/message", auth, sendChatMessage);
router.post("/chat/status", auth, updateTicketStatus);
router.get("/me", auth, getMyTickets);
router.get("/:id", auth, getTicketById);
router.delete("/:id", auth, deleteTicket);


export default router;
