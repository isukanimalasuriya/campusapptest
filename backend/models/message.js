import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      default: "",
      trim: true,
    },
    // File attachment
    file: {
      url: { type: String, default: null },
      key: { type: String, default: null },
      originalName: { type: String, default: null },
      mimeType: { type: String, default: null },
      size: { type: Number, default: null },
      fileType: {
        type: String,
        enum: ["image", "video", "audio", "document", "other", null],
        default: null,
      },
    },
    // Reply to another message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    messageType: {
      type: String,
      enum: ["text", "file", "system"],
      default: "text",
    },
    // Soft delete
    deleted: { type: Boolean, default: false },
    // Track who has read this message
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;