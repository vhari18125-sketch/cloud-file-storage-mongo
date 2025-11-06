import mongoose from "mongoose";

const fileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  originalName: String,
  filename: String,
  size: Number, // ✅ Added field
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("File", fileSchema);
