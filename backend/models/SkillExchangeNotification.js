import mongoose from "mongoose";

const skillExchangeNotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "new_volunteer",
        "volunteer_accepted",
        "learning_matched",
        "new_join_request",
        "join_approved",
        "join_rejected",
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    read: { type: Boolean, default: false },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

skillExchangeNotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

const SkillExchangeNotification = mongoose.model(
  "SkillExchangeNotification",
  skillExchangeNotificationSchema,
);
export default SkillExchangeNotification;
