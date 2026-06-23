import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import { getFilesCollection, getShareCodesCollection } from './db.js';

const router = express.Router();

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

function buildShareCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function isExpired(shareDoc) {
  if (!shareDoc.expiresAt) return false;
  return new Date(shareDoc.expiresAt).getTime() < Date.now();
}

async function generateUniqueShareCode(shareCodesCollection) {
  let attempts = 0;
  while (attempts < 20) {
    const candidate = buildShareCode();
    const existing = await shareCodesCollection.findOne({
      shareCode: candidate,
    });
    if (!existing) return candidate;
    attempts += 1;
  }
  throw new Error('Unable to generate unique share code');
}

// POST - Upload a file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const collection = await getFilesCollection();
    const fileData = {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date(),
      description: req.body.description || '',
    };
    const result = await collection.insertOne(fileData);
    res.json({ success: true, file: { ...fileData, _id: result.insertedId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Get all files
router.get('/files', async (req, res) => {
  try {
    const collection = await getFilesCollection();
    const files = await collection.find({}).sort({ uploadedAt: -1 }).toArray();
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Get single file details
router.get('/files/:id', async (req, res) => {
  try {
    const collection = await getFilesCollection();
    const file = await collection.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!file) return res.status(404).json({ error: 'File not found' });
    res.json(file);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Update file description
router.put('/files/:id', async (req, res) => {
  try {
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
router.delete('/files/:id', async (req, res) => {
  try {
    const { unlink } = await import('fs/promises');
    const filesCollection = await getFilesCollection();
    const shareCodesCollection = await getShareCodesCollection();
    const file = await filesCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!file) return res.status(404).json({ error: 'File not found' });
    try {
      await unlink(`uploads/${file.storedName}`);
    } catch (e) {
      console.log('File already removed from disk');
    }
    await shareCodesCollection.deleteMany({
      fileId: new ObjectId(req.params.id),
    });
    await filesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Generate share code for a file
router.post('/files/:id/share', async (req, res) => {
  try {
    const filesCollection = await getFilesCollection();
    const shareCodesCollection = await getShareCodesCollection();

    const file = await filesCollection.findOne({
      _id: new ObjectId(req.params.id),
    });
    if (!file) return res.status(404).json({ error: 'File not found' });

    const expiresInHours = Number(req.body?.expiresInHours);
    const hasCustomExpiry =
      Number.isFinite(expiresInHours) && expiresInHours > 0;
    const expiresAt = hasCustomExpiry
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const shareCode = await generateUniqueShareCode(shareCodesCollection);

    const shareDoc = {
      fileId: new ObjectId(req.params.id),
      shareCode,
      shareEnabled: true,
      shareCreatedAt: new Date(),
      expiresAt,
      downloadCount: 0,
    };

    await shareCodesCollection.insertOne(shareDoc);

    const shareLink = `${req.protocol}://${req.get('host')}/share.html?code=${shareCode}`;
    res.json({ success: true, shareCode, shareLink, expiresAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Access file details with share code
router.get('/share/:code', async (req, res) => {
  try {
    const filesCollection = await getFilesCollection();
    const shareCodesCollection = await getShareCodesCollection();

    const shareDoc = await shareCodesCollection.findOne({
      shareCode: req.params.code,
    });
    if (!shareDoc || !shareDoc.shareEnabled) {
      return res.status(404).json({ error: 'Share code not found' });
    }
    if (isExpired(shareDoc)) {
      return res.status(410).json({ error: 'Share code expired' });
    }

    const file = await filesCollection.findOne({ _id: shareDoc.fileId });
    if (!file) return res.status(404).json({ error: 'File not found' });

    res.json({
      _id: file._id,
      originalName: file.originalName,
      size: file.size,
      mimetype: file.mimetype,
      description: file.description || '',
      uploadedAt: file.uploadedAt,
      expiresAt: shareDoc.expiresAt,
      downloadCount: shareDoc.downloadCount || 0,
      shareCode: shareDoc.shareCode,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Download file with share code
router.get('/share/:code/download', async (req, res) => {
  try {
    const filesCollection = await getFilesCollection();
    const shareCodesCollection = await getShareCodesCollection();

    const shareDoc = await shareCodesCollection.findOne({
      shareCode: req.params.code,
    });
    if (!shareDoc || !shareDoc.shareEnabled) {
      return res.status(404).json({ error: 'Share code not found' });
    }
    if (isExpired(shareDoc)) {
      return res.status(410).json({ error: 'Share code expired' });
    }

    const file = await filesCollection.findOne({ _id: shareDoc.fileId });
    if (!file) return res.status(404).json({ error: 'File not found' });

    const fullPath = path.resolve('uploads', file.storedName);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File missing on server' });
    }

    res.download(fullPath, file.originalName, async (err) => {
      if (err) return;
      await shareCodesCollection.updateOne(
        { _id: shareDoc._id },
        { $inc: { downloadCount: 1 } }
      );
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Update share code settings
router.put('/share/:code', async (req, res) => {
  try {
    const shareCodesCollection = await getShareCodesCollection();
    const filesCollection = await getFilesCollection();

    const shareDoc = await shareCodesCollection.findOne({
      shareCode: req.params.code,
    });
    if (!shareDoc)
      return res.status(404).json({ error: 'Share code not found' });

    const update = {};

    if (typeof req.body.description === 'string') {
      await filesCollection.updateOne(
        { _id: shareDoc.fileId },
        { $set: { description: req.body.description } }
      );
    }

    if (typeof req.body.shareEnabled === 'boolean') {
      update.shareEnabled = req.body.shareEnabled;
    }

    if (req.body.expiresAt) {
      const parsed = new Date(req.body.expiresAt);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Invalid expiresAt value' });
      }
      update.expiresAt = parsed;
    }

    const expiresInHours = Number(req.body.expiresInHours);
    if (Number.isFinite(expiresInHours) && expiresInHours > 0) {
      update.expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
    }

    if (Object.keys(update).length > 0) {
      await shareCodesCollection.updateOne(
        { _id: shareDoc._id },
        { $set: update }
      );
    }

    const updated = await shareCodesCollection.findOne({ _id: shareDoc._id });
    res.json({ success: true, shareDoc: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Delete share code
router.delete('/share/:code', async (req, res) => {
  try {
    const shareCodesCollection = await getShareCodesCollection();
    const shareDoc = await shareCodesCollection.findOne({
      shareCode: req.params.code,
    });
    if (!shareDoc)
      return res.status(404).json({ error: 'Share code not found' });
    await shareCodesCollection.deleteOne({ _id: shareDoc._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
