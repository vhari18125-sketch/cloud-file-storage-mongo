import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import File from "../models/File.js";
import Activity from "../models/Activity.js"; // ✅ Import Activity model

const router = express.Router();

// 🗂️ Directory setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📦 Multer storage setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// 🟢 Upload file
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = new File({
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
    });

    await file.save();

    // ✅ Log upload activity
    await Activity.create({
      fileName: req.file.originalname,
      action: "upload",
    });

    res.status(200).json({ message: "File uploaded successfully", file });
  } catch (error) {
    res.status(500).json({ message: "Error uploading file", error: error.message });
  }
});

// 🔵 Get all files
router.get("/", async (req, res) => {
  try {
    const files = await File.find().sort({ uploadedAt: -1 });
    res.json(files);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 🟣 Download file
router.get("/download/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    const filePath = path.resolve(file.filePath);
    if (!fs.existsSync(filePath))
      return res.status(404).json({ message: "File not found on server" });

    // ✅ Log download activity
    await Activity.create({
      fileName: file.fileName,
      action: "download",
    });

    res.download(filePath, file.fileName);
  } catch (err) {
    res.status(500).json({ message: "Error downloading file", error: err.message });
  }
});

// 🔴 Delete file
router.delete("/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ message: "File not found" });

    fs.unlinkSync(file.filePath);
    await file.deleteOne();

    // ✅ Log delete activity
    await Activity.create({
      fileName: file.fileName,
      action: "delete",
    });

    res.json({ message: "File deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting file", error: err.message });
  }
});

// 🧾 Fetch recent activity logs
router.get("/activity/logs", async (req, res) => {
  try {
    const logs = await Activity.find().sort({ timestamp: -1 }).limit(20);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching activity logs", error: err.message });
  }
});

export default router;
