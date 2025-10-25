import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: { type: String, required: true },
    category: { type: String, default: "General" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    attendees: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

eventSchema.virtual("attendeeCount").get(function computeAttendeeCount() {
  return this.attendees?.length || 0;
});

eventSchema.index({ date: 1 });

eventSchema.methods.hasAttendee = function hasAttendee(userId) {
  return this.attendees.some((attendeeId) => attendeeId.toString() === userId.toString());
};

const Event = mongoose.model("Event", eventSchema);

export default Event;
