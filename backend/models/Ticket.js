import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  category: { type: String, required: true },
  messages: [
    {
      role: { type: String, enum: ['user', 'ai'], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  status: { type: String, enum: ['active', 'resolved', 'escalated'], default: 'active' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Ticket', ticketSchema);