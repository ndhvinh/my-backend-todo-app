import mongoose from "mongoose";
import { TASK_TYPE } from '../constants/task.js'

const TaskSchema = new mongoose.Schema({
  listId: { type: mongoose.Schema.Types.ObjectId, ref: "TaskList", required: true },
  title: { type: String, required: true },
  taskType: { type: String, enum: Object.values(TASK_TYPE), default: TASK_TYPE.TEXT },
  text: { type: String },
  completed: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

// Index để query nhanh hơn
TaskSchema.index({ listId: 1, createdAt: -1 });

export default mongoose.model("Task", TaskSchema);
