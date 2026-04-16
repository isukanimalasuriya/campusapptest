import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    course: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: [
        "General Discussion",
        "Exams",
        "Mid Exam",
        "Final Exam",
        "Lab Test",
        "Viva",
        "Research",
        "Assignment Help",
        "Project Collaboration",
      ],
      default: "General Discussion",
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    creatorRole: {
      type: String,
      enum: ["admin", "moderator"],
      default: "admin",
    },
    maxMembers: { type: Number, default: 50, min: 2, max: 200 },
    isPublic: { type: Boolean, default: true },
    inviteCode: { type: String, unique: true, sparse: true },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: {
          type: String,
          enum: ["admin", "moderator", "member"],
          default: "member",
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    status: { type: String, enum: ["active", "archived"], default: "active" },
  },
  { timestamps: true }
);

// ✅ Use async instead of next() callback — avoids the "next is not a function" error
groupSchema.pre("save", async function () {
  if (!this.inviteCode && this.isNew) {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.inviteCode = code;
  }
});

groupSchema.methods.generateInviteCode = function () {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

groupSchema.methods.isFull = function () {
  return this.members.length >= this.maxMembers;
};

groupSchema.methods.addMember = function (userId, role = "member") {
  if (this.isFull()) {
    throw new Error("Group has reached maximum member limit");
  }
  const existingMember = this.members.find(
    (member) => member.user.toString() === userId.toString()
  );
  if (existingMember) {
    throw new Error("User is already a member of this group");
  }
  this.members.push({ user: userId, role, joinedAt: new Date() });
};

const Group = mongoose.model("Group", groupSchema);
export default Group;