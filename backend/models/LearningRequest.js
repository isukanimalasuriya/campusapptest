import mongoose from "mongoose";

const volunteerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  userName: { type: String, required: true },
  message: { type: String, required: true },
  offeredAt: { type: Date, default: Date.now },
});

const learningRequestSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  moduleCode: { type: String, required: true },
  titleWhatIWantToLearn: { type: String, required: true },
  description: { type: String, required: true },
  preferredTime: { type: Date, required: true },
  skillLevel: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
  mode: { type: String, enum: ["Online", "Offline"], required: true },
  requesterName: { type: String, required: true },
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: {
    type: String,
    enum: ["Open", "Matched", "Closed"],
    default: "Open",
  },
  volunteers: [volunteerSchema],
  acceptedVolunteer: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: { type: String },
  },
  resultingSkillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill" },
  createdAt: { type: Date, default: Date.now },
});

learningRequestSchema.index({ requesterId: 1, createdAt: -1 });
learningRequestSchema.index({ status: 1, createdAt: -1 });

const LearningRequest = mongoose.model("LearningRequest", learningRequestSchema);
export default LearningRequest;
