import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["submitted", "in_review", "resolved"], default: "submitted" },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    response: { type: String },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

feedbackSchema.index({ status: 1, submittedAt: -1 });

const Feedback = mongoose.model("Feedback", feedbackSchema);

export default Feedback;
