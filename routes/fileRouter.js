import express from "express";
import multer from "multer";
import File from "../models/File.js";
import { protect } from "../middleware/authMiddleware.js";
import fs from "fs";
import path from "path";

const router = express.Router();

// Ensure uploads folder exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// POST /upload - Upload a file
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const file = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user.id,
    });

    await file.save();
    res.json({ message: "File uploaded successfully!", file });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during file upload" });
  }
});

// GET / - List all files (admin sees all, user sees own)
router.get("/", protect, async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { uploadedBy: req.user.id };
    const files = await File.find(query).populate("uploadedBy", "email role");
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching files" });
  }
});

// GET /download/:id - Download a file
router.get("/download/:id", protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    res.download(path.join(uploadDir, file.filename), file.originalName);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error downloading file" });
  }
});

// DELETE /:id - Delete a file
router.delete("/:id", protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    if (req.user.role !== "admin" && file.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You cannot delete this file" });
    }

    fs.unlinkSync(path.join(uploadDir, file.filename));
    await File.findByIdAndDelete(req.params.id);

    res.json({ message: "File deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting file" });
  }
});

export default router;
