import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import File from "../models/File.js";
import Activity from "../models/Activity.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// 🟢 Upload file
router.post("/upload", authMiddleware, upload.single("file"), async (req, res) => {
  const file = await File.create({
    user: req.user.id,
    originalName: req.file.originalname,
    path: req.file.path,
    size: req.file.size,
  });

  await Activity.create({
    user: req.user.id,
    action: "upload",
    fileName: req.file.originalname,
  });

  res.json(file);
});

// 🟢 Get user files (sorted by recent)
router.get("/", authMiddleware, async (req, res) => {
  const files = await File.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(files);
});

// 🟢 Download file
router.get("/download/:id", authMiddleware, async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).json({ message: "File not found" });

  await Activity.create({
    user: req.user.id,
    action: "download",
    fileName: file.originalName,
  });

  res.download(file.path, file.originalName);
});

// 🟢 Delete file
router.delete("/:id", authMiddleware, async (req, res) => {
  const file = await File.findById(req.params.id);
  if (!file) return res.status(404).json({ message: "File not found" });

  fs.unlinkSync(file.path);
  await file.deleteOne();
  res.json({ message: "File deleted successfully" });
});

// 🟢 Get recent activity
router.get("/activity", authMiddleware, async (req, res) => {
  const logs = await Activity.find({ user: req.user.id })
    .sort({ timestamp: -1 })
    .limit(10);
  res.json(logs);
});

export default router;
