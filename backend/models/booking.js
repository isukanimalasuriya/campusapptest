import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudySpace",
      required: true,
      index: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
      index: true,
    },
    seats: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["ACTIVE", "ENDED"],
      default: "ACTIVE",
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
  },
  { timestamps: true },
);

/**
 * Enforces: one ACTIVE booking per user (race-condition safe)
 */
bookingSchema.index(
  { user: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } },
);

export const Booking = mongoose.model("Booking", bookingSchema);
