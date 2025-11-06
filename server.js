import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import fileRouter from "./routes/fileRouter.js";
import authRoutes from "./routes/authRouter.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Directory setup for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Serve uploaded files folder
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // ✅ ensures uploaded files are accessible

// API routes
app.use("/api/files", fileRouter);
app.use("/api/auth", authRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
