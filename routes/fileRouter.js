import express from "express";
import multer from "multer";
import File from "../models/File.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import fs from "fs";
import path from "path";

const router = express.Router();

const upload = multer({ dest: "uploads/" });

// Upload file
router.post("/upload", protect, upload.single("file"), async (req, res) => {
  const file = new File({
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    uploadedBy: req.user.id,
  });
  await file.save();
  res.json({ message: "File uploaded successfully!" });
});

// Get all files (admin can view all, user sees only their own)
router.get("/", protect, async (req, res) => {
  const query = req.user.role === "admin" ? {} : { uploadedBy: req.user.id };
  const files = await File.find(query);
  res.json(files);
});

// Download file
router.get("/download/:id", protect, async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).json({ message: "File not found" });
  res.download(path.resolve("uploads", file.filename), file.originalName);
});

// Delete file
router.delete("/:id", protect, async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).json({ message: "File not found" });

  if (req.user.role !== "admin" && file.uploadedBy.toString() !== req.user.id) {
    return res.status(403).json({ message: "You cannot delete this file" });
  }

  fs.unlinkSync(path.resolve("uploads", file.filename));
  await File.findByIdAndDelete(req.params.id);
  res.json({ message: "File deleted successfully!" });
});

export default router;
