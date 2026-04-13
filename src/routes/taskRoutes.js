import express from "express";
import { authenticateToken } from "../middlewares/auth.js";
import {
  createTask,
  deleteTask,
  getCompletedTasks,
  getTaskDetail,
  getTasks,
  getTasksByList,
  updateTask,
} from "../controllers/taskController.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getTasks);
router.get("/list/:listId", getTasksByList);
router.get("/completed", getCompletedTasks);
router.post("/", createTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);
router.get("/:id", getTaskDetail);

export default router;
