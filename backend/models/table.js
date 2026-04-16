import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudySpace",
      required: true,
      index: true,
    },
    code: { type: String, required: true }, // "T8"
    type: { type: String, enum: ["GROUP", "SINGLE"], required: true },
    capacity: { type: Number, required: true, min: 1 },
    availableSeats: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

// unique table code within a study space
tableSchema.index({ space: 1, code: 1 }, { unique: true });

export const Table = mongoose.model("Table", tableSchema);
