import express from "express";
import multer from "multer";
import File from "../models/File.js";
import { protect } from "../middleware/authMiddleware.js";
import fs from "fs";
import path from "path";

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ✅ Upload file
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const file = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,          // ✅ store multer path
      uploadedBy: req.user.id,      // ✅ associate with user
    });

    await file.save();
    res.json({ message: "File uploaded successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "File upload failed", error: err.message });
  }
});


// ✅ Get all files (user sees own files, admin sees all)
router.get("/", protect, async (req, res) => {
  try {
    const query = req.user.role === "admin" ? {} : { uploadedBy: req.user.id };
    const files = await File.find(query).sort({ createdAt: -1 });
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch files", error: err.message });
  }
});

// ✅ Download file
router.get("/download/:id", protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    // Only uploader or admin can download
    if (req.user.role !== "admin" && file.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const filePath = path.resolve("uploads", file.filename);
    res.download(filePath, file.originalName);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Download failed", error: err.message });
  }
});

// ✅ Delete file
router.delete("/:id", protect, async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    // Only uploader or admin can delete
    if (req.user.role !== "admin" && file.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "You cannot delete this file" });
    }

    fs.unlinkSync(path.resolve("uploads", file.filename));
    await File.findByIdAndDelete(req.params.id);
    res.json({ message: "File deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

export default router;
