import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);

const fileTypes = [
  { ext: "pdf", mime: "application/pdf" },
  { ext: "jpg", mime: "image/jpeg" },
  { ext: "png", mime: "image/png" },
  { ext: "docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  { ext: "xlsx", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  { ext: "mp4", mime: "video/mp4" },
  { ext: "mp3", mime: "audio/mpeg" },
  { ext: "zip", mime: "application/zip" },
  { ext: "txt", mime: "text/plain" },
  { ext: "pptx", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
];

const descriptions = [
  "Project report",
  "Meeting notes",
  "Design mockup",
  "Financial summary",
  "Research paper",
  "Presentation slides",
  "Budget analysis",
  "Team update",
  "Client proposal",
  "Technical documentation",
  "Marketing materials",
  "Product roadmap",
  "User research",
  "Code review notes",
  "Sprint retrospective",
  "",
];

const names = [
  "report", "document", "image", "presentation", "spreadsheet",
  "notes", "summary", "proposal", "analysis", "review",
  "update", "brief", "memo", "draft", "final",
  "backup", "archive", "export", "import", "output",
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - randomInt(0, daysBack));
  d.setHours(randomInt(0, 23), randomInt(0, 59));
  return d;
}

async function seed() {
  try {
    await client.connect();
    const db = client.db("cloudbox");
    const filesCollection = db.collection("files");
    const shareCodesCollection = db.collection("shareCodes");

    await shareCodesCollection.createIndex(
      { shareCode: 1 },
      { unique: true }
    );

    console.log("Connected to MongoDB. Seeding data...");

    const existingCount = await filesCollection.countDocuments();
    if (existingCount >= 1000) {
      console.log(`Already have ${existingCount} records. Skipping seed.`);
      await client.close();
      return;
    }

    const fileDocs = [];
    const shareCodeDocs = [];
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

    function makeShareCode() {
      let code = "";
      for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      return code;
    }

    for (let i = 1; i <= 1000; i++) {
      const fileType = randomItem(fileTypes);
      const name = randomItem(names);
      const uploadedAt = randomDate(30);
      const expiresAt = new Date(uploadedAt.getTime() + 24 * 60 * 60 * 1000);

      const fileDoc = {
        originalName: `${name}_${String(i).padStart(4, "0")}.${fileType.ext}`,
        storedName: `${Date.now()}-${i}-${name}.${fileType.ext}`,
        size: randomInt(1024, 10 * 1024 * 1024),
        mimetype: fileType.mime,
        uploadedAt,
        description: randomItem(descriptions),
      };

      fileDocs.push(fileDoc);

      if (i % 3 === 0) {
        shareCodeDocs.push({
          shareCode: makeShareCode() + String(i).padStart(4, "0"),
          shareEnabled: true,
          shareCreatedAt: uploadedAt,
          expiresAt,
          downloadCount: randomInt(0, 50),
        });
      }
    }

    await filesCollection.insertMany(fileDocs);
    console.log(`Inserted ${fileDocs.length} file records`);

    await shareCodesCollection.insertMany(shareCodeDocs);
    console.log(`Inserted ${shareCodeDocs.length} share code records`);

    const totalFiles = await filesCollection.countDocuments();
    const totalShares = await shareCodesCollection.countDocuments();
    console.log(`Total files: ${totalFiles}`);
    console.log(`Total share codes: ${totalShares}`);
    console.log("Seeding complete!");

    await client.close();
  } catch (err) {
    console.error("Seed error:", err);
    await client.close();
  }
}

seed();