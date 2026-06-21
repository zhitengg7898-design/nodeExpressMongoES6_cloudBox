import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import filesRouter from "./backend/filesRoutes.js";
import { connectDB } from "./backend/db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("frontend"));
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api", filesRouter);

// Connect to DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});