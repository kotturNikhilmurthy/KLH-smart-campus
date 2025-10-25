import mongoose from "mongoose";

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    members: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    eventsHosted: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
      default: [],
    },
  },
  { timestamps: true }
);

clubSchema.virtual("memberCount").get(function memberCount() {
  return this.members?.length || 0;
});

clubSchema.index({ category: 1 });

const Club = mongoose.model("Club", clubSchema);

export default Club;
