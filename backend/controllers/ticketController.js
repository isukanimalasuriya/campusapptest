import Ticket from "../models/Ticket.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set in .env");
  return new GoogleGenerativeAI(apiKey);
};

export const createSupportChat = asyncHandler(async (req, res) => {
  const { category } = req.body;

  if (!category) {
    return res.status(400).json({ message: "Category is required" });
  }

  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const ticket = await Ticket.create({
    category,
    messages: [
      {
        role: "ai",
        content: `Hi ${req.user.name || "Student"}! I'm your CampusCompanion support assistant for ${category}. Please describe your issue in detail.`,
      },
    ],
    user: req.user.id,
    status: "active",
  });

  res.status(201).json({ ticket });
});

export const sendChatMessage = asyncHandler(async (req, res) => {
  const { ticketId, message } = req.body;

  if (!ticketId || !message) {
    return res.status(400).json({ message: "Ticket ID and message are required" });
  }

  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  if (ticket.user.toString() !== req.user.id) {
    return res.status(403).json({ message: "Access denied" });
  }

  if (ticket.status !== "active") {
    return res.status(400).json({ message: "Ticket is no longer active" });
  }

  ticket.messages.push({ role: "user", content: message });

  const user = req.user;
  const conversation = ticket.messages
    .map((msg) => `${msg.role === "user" ? "Student" : "AI"}: ${msg.content}`)
    .join("\n");

  const systemPrompt = `You are a university support assistant for CampusCompanion. Student: ${user.name} (${user.studentId}). Issue category: ${ticket.category}. Respond helpfully and suggest escalation if issue remains unresolved after a few rounds.`;

  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `${systemPrompt}\n\nConversation:\n${conversation}\nAI:`;

    const result = await model.generateContent(prompt);
    const aiContent = result.response.text();

    if (!aiContent || aiContent.trim() === "") {
      throw new Error("No AI response received from Gemini");
    }

    ticket.messages.push({ role: "ai", content: aiContent });
    ticket.updatedAt = new Date();
    await ticket.save();

    res.json({ ticket, aiMessage: aiContent });
  } catch (error) {
    console.error("Gemini API error:", error.message || error);
    res.status(500).json({ message: "AI processing failed", error: error.message });
  }
});

export const updateTicketStatus = asyncHandler(async (req, res) => {
  const { ticketId, status } = req.body;

  if (!ticketId || !status) {
    return res.status(400).json({ message: "Ticket ID and status are required" });
  }

  if (!['active', 'resolved', 'escalated'].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  if (ticket.user.toString() !== req.user.id) {
    return res.status(403).json({ message: "Access denied" });
  }

  ticket.status = status;
  ticket.updatedAt = new Date();
  await ticket.save();

  res.json({ ticket });
});

export const deleteTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ message: "Ticket ID is required" });
  }

  const ticket = await Ticket.findById(id);
  if (!ticket) {
    return res.status(404).json({ message: "Ticket not found" });
  }

  if (ticket.user.toString() !== req.user.id) {
    return res.status(403).json({ message: "Access denied" });
  }

  await ticket.deleteOne();
  res.json({ message: "Ticket deleted" });
});

export const getMyTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json({ tickets });
});

export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  if (ticket.user.toString() !== req.user.id) {
    return res.status(403).json({ message: "Access denied" });
  }

  res.json({ ticket });
});
