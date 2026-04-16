import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    type: {
      type: String,
      enum: ["link", "note"],
      default: "link",
    },
    url: { type: String, default: "" },
    content: { type: String, default: "" },
    // S3 file fields (when shared from chat)
    fileKey: { type: String, default: null },
    mimeType: { type: String, default: null },
    fileType: {
      type: String,
      enum: ["image", "video", "audio", "document", "other", null],
      default: null,
    },
    size: { type: Number, default: null },
    sourceMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

const Resource = mongoose.model("Resource", resourceSchema);
export default Resource;