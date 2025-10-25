import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: { type: String, default: "General" },
    isPinned: { type: Boolean, default: false },
    postedBy: { type: String, required: true },
    postedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

announcementSchema.index({ isPinned: -1, postedAt: -1 });

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
