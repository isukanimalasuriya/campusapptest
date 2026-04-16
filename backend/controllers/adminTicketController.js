import Ticket from "../models/Ticket.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// GET /api/admin/tickets — all tickets with optional status filter
export const getAllTickets = asyncHandler(async (req, res) => {
  const { status } = req.query; // ?status=active | resolved | escalated

  const query = status && status !== "all" ? { status } : {};

  const tickets = await Ticket.find(query)
    .populate("user", "name email studentId")
    .sort({ updatedAt: -1 });

  res.json({ tickets });
});

// GET /api/admin/tickets/:id — single ticket detail
export const getTicketByIdAdmin = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate(
    "user",
    "name email studentId"
  );
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  res.json({ ticket });
});

// POST /api/admin/tickets/:id/reply — admin sends a message into the ticket
export const adminReplyToTicket = asyncHandler(async (req, res) => {
  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ message: "Reply message is required" });
  }

  const ticket = await Ticket.findById(req.params.id).populate(
    "user",
    "name email studentId"
  );
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  // Push as an "ai" role message so the existing chat UI renders it correctly
  ticket.messages.push({
    role: "ai",
    content: `[Admin — ${req.user.name || "Support Team"}]: ${message.trim()}`,
  });
  ticket.updatedAt = new Date();
  await ticket.save();

  res.json({ ticket });
});

// PATCH /api/admin/tickets/:id/status — admin can force any status
export const updateTicketStatusAdmin = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!["active", "resolved", "escalated"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  ticket.status = status;
  ticket.updatedAt = new Date();
  await ticket.save();

  res.json({ ticket });
});

// DELETE /api/admin/tickets/:id — admin hard-delete
export const deleteTicketAdmin = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  await ticket.deleteOne();
  res.json({ message: "Ticket deleted" });
});