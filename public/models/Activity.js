import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: { type: String, enum: ["upload", "download"], required: true },
  fileName: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Activity", activitySchema);
