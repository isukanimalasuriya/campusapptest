import mongoose from "mongoose";

const skillRequestSchema = new mongoose.Schema({
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },
  problemDescription: { type: String, required: true },
  preferredTime: { type: Date, required: true },
  requesterName: { type: String, required: true },
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  status: { 
    type: String, 
    enum: ["Pending", "Scheduled", "Completed"], 
    default: "Pending" 
  },
  rating: { type: Number, min: 1, max: 5 },
  feedback: { type: String },
  createdAt: { type: Date, default: Date.now }
});

skillRequestSchema.index({ requesterId: 1, createdAt: -1 });
skillRequestSchema.index({ skillId: 1, createdAt: -1 });

const SkillRequest = mongoose.model("SkillRequest", skillRequestSchema);
export default SkillRequest;
