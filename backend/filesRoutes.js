import express from "express";
import multer from "multer";
import path from "path";
import { getFilesCollection } from "./db.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// POST - Upload a file
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const collection = await getFilesCollection();
    const fileData = {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date(),
      description: req.body.description || "",
    };
    const result = await collection.insertOne(fileData);
    res.json({ success: true, file: { ...fileData, _id: result.insertedId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Get all files
router.get("/files", async (req, res) => {
  try {
    const collection = await getFilesCollection();
    const files = await collection.find({}).sort({ uploadedAt: -1 }).toArray();
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Get single file details
router.get("/files/:id", async (req, res) => {
  try {
    const { ObjectId } = await import("mongodb");
    const collection = await getFilesCollection();
    const file = await collection.findOne({ _id: new ObjectId(req.params.id) });
    if (!file) return res.status(404).json({ error: "File not found" });
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Update file description
router.put("/files/:id", async (req, res) => {
  try {
    const { ObjectId } = await import("mongodb");
    const collection = await getFilesCollection();
    await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { description: req.body.description } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Delete a file
router.delete("/files/:id", async (req, res) => {
  try {
    const { ObjectId } = await import("mongodb");
    const { unlink } = await import("fs/promises");
    const collection = await getFilesCollection();
    const file = await collection.findOne({ _id: new ObjectId(req.params.id) });
    if (!file) return res.status(404).json({ error: "File not found" });
    // Delete from filesystem
    try {
      await unlink(`uploads/${file.storedName}`);
    } catch (e) {
      console.log("File already removed from disk");
    }
    await collection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;