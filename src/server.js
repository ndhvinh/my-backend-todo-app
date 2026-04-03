import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import taskRoutes from "./routes/taskRoutes.js";
import listRoutes from "./routes/listRoutes.js";
import { startTaskCleanupCron } from "./cron/taskCleanup.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/tasks", taskRoutes);
app.use("/list", listRoutes);

// Handle 404 - Not Found for any unhandled routes
app.use((req, res, next) => {
  res.status(404).send("Sorry, can't find that!");
});

// Connect MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB Atlas");
    startTaskCleanupCron();
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Listen for Mongoose connection events
mongoose.connection.on("error", (err) => {
  console.error("❌ Mongoose runtime error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ Mongoose connection lost.");
});

mongoose.connection.on("reconnected", () => {
  console.log("✅ Mongoose reconnected.");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🔌 Mongoose connection closed due to app termination.");
  process.exit(0);
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
