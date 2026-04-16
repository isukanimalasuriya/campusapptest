import mongoose from "mongoose";

const studySpaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    location: { type: String, required: true }, // "Central Library - Ground Floor"
    totalSeats: { type: Number, required: true, min: 0 },
    availableSeats: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["AVAILABLE", "NEARLY_FULL", "FULL"],
      default: "AVAILABLE",
    },
  },
  { timestamps: true },
);

studySpaceSchema.methods.recomputeStatus = function () {
  if (this.availableSeats <= 0) this.status = "FULL";
  else if (this.availableSeats / this.totalSeats <= 0.2)
    this.status = "NEARLY_FULL";
  else this.status = "AVAILABLE";
};

export const StudySpace = mongoose.model("StudySpace", studySpaceSchema);
