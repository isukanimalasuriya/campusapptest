import mongoose from "mongoose";

const skillSchema = new mongoose.Schema({
  skillName: { type: String, required: true },
  subject: { type: String, required: true },
  moduleCode: { type: String, required: true },
  description: { type: String },
  skillLevel: { 
    type: String, 
    enum: ["Beginner", "Intermediate", "Advanced"], 
    required: true 
  },
  mode: { 
    type: String, 
    enum: ["Online", "Offline"], 
    required: true 
  },
  isPublic: { 
    type: Boolean, 
    default: false 
  },
  meetingLink: { 
    type: String 
  },
  availability: { type: Date, required: true }, 
  providerName: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  joinRequests: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: { type: String, required: true },
      status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending",
      },
      requestedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now }
});

skillSchema.index({ userId: 1, createdAt: -1 });
skillSchema.index({ isPublic: 1, createdAt: -1 });

const Skill = mongoose.model("Skill", skillSchema);
export default Skill;
