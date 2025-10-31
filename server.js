import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import multer from "multer";
import cors from "cors";
import fs from "fs";

dotenv.config();
console.log("Loaded MONGO_URI:", process.env.MONGO_URI);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(".")); // Serve index.html and other static files

const PORT = process.env.PORT || 5000;

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => {
    console.error("❌ MongoDB connection error:");
    console.error(err.message);
  });

// File Schema
const fileSchema = new mongoose.Schema({
  name: String,
  size: Number,
  uploadDate: { type: Date, default: Date.now },
  data: Buffer,
  contentType: String
});
const File = mongoose.model("File", fileSchema);

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload route
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const newFile = new File({
      name: req.file.originalname,
      size: req.file.size,
      data: req.file.buffer,
      contentType: req.file.mimetype
    });
    await newFile.save();
    res.json({ message: "✅ File uploaded successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "❌ Error uploading file" });
  }
});

// Get all files route
app.get("/files", async (req, res) => {
  const files = await File.find({}, "name size uploadDate _id");
  res.json(files);
});

// View file route
app.get("/files/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).send("File not found");
    res.contentType(file.contentType);
    res.send(file.data);
  } catch (err) {
    res.status(500).send("Error retrieving file");
  }
});

// 🗑️ Delete file route
app.delete("/files/:id", async (req, res) => {
  try {
    const result = await File.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: "File not found" });
    res.json({ message: "🗑️ File deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "❌ Error deleting file" });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
