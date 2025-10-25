import mongoose from "mongoose";

const pollOptionSchema = new mongoose.Schema(
  {
    optionKey: { type: String, required: true },
    text: { type: String, required: true },
    votes: { type: Number, default: 0 },
  },
  { _id: false }
);

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    description: { type: String, default: "" },
    options: { type: [pollOptionSchema], validate: (val) => val.length >= 2 },
    endDate: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    votes: {
      type: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          optionKey: { type: String, required: true },
        },
      ],
      default: [],
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

pollSchema.virtual("totalVotes").get(function totalVotes() {
  return this.votes?.length || 0;
});

pollSchema.methods.hasUserVoted = function hasUserVoted(userId) {
  return this.votes.some((vote) => vote.user.toString() === userId.toString());
};

const Poll = mongoose.model("Poll", pollSchema);

export default Poll;
