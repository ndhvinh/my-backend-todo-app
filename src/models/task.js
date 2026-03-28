import mongoose from "mongoose";
import { TASK_TYPE } from "../constants/task.js";

const ChecklistItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
  },
  { _id: false },
);

const TaskSchema = new mongoose.Schema(
  {
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TaskList",
      required: true,
    },
    title: { type: String, required: true },
    taskType: {
      type: String,
      enum: Object.values(TASK_TYPE),
      default: TASK_TYPE.TEXT,
    },
    text: { type: String }, // for normal text task
    checklist: {
      type: [ChecklistItemSchema],
      default: [],
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Index để query nhanh hơn
TaskSchema.index({ listId: 1, createdAt: -1 });

export default mongoose.model("Task", TaskSchema);
