import mongoose from "mongoose";

const lostItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: "Others" },
    location: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: ["lost", "found", "claimed"], default: "lost" },
    imageUrl: { type: String, default: "" },
    studentId: { type: String, required: true, trim: true },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

lostItemSchema.index({ status: 1, date: -1 });

const LostItem = mongoose.model("LostItem", lostItemSchema);

export default LostItem;
