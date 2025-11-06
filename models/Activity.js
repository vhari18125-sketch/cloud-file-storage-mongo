import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  action: {
    type: String, // e.g., "upload", "download", "delete"
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
