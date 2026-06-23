import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI);

let db;

export async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("cloudbox");
    await db
      .collection("shareCodes")
      .createIndex({ shareCode: 1 }, { unique: true });
    console.log("Connected to MongoDB");
  }
  return db;
}

export async function getFilesCollection() {
  const db = await connectDB();
  return db.collection("files");
}

export async function getShareCodesCollection() {
  const db = await connectDB();
  return db.collection("shareCodes");
}