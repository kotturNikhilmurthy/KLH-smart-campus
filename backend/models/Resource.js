import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true },
    department: { type: String, required: true },
    semester: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    uploaderName: { type: String, required: true },
    downloads: { type: Number, default: 0 },
    fileUrl: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

resourceSchema.index({ department: 1, semester: 1 });

const Resource = mongoose.model("Resource", resourceSchema);

export default Resource;
