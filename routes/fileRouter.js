import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import File from "../models/File.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Create uploads folder if missing
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });


// 📁 Upload a file
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    const newFile = new File({
      user: req.user.id,
      originalName: req.file.originalname,
      filename: req.file.filename
    });
    await newFile.save();
    res.json({ message: "File uploaded successfully", file: newFile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});


// 📄 Get all user files
router.get("/", authMiddleware, async (req, res) => {
  try {
    const files = await File.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch files" });
  }
});


// ⬇️ Download a file
router.get("/download/:id", authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Access denied" });

    const filePath = path.resolve("uploads", file.filename);
    res.download(filePath, file.originalName);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to download file" });
  }
});


// 🗑️ Delete a file
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Access denied" });

    const filePath = path.resolve("uploads", file.filename);
    fs.unlinkSync(filePath);
    await file.deleteOne();
    res.json({ message: "File deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete file" });
  }
});

export default router;
