import mongoose from "mongoose";
import { TASK_TYPE } from "../constants/task.js";

const ChecklistItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    checked: { type: Boolean, default: false },
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

// Virtual join sang TaskList để lấy name
TaskSchema.virtual("listInfo", {
  ref: "TaskList",
  localField: "listId",
  foreignField: "_id",
  justOne: true,
});

// Field trả về cho client
TaskSchema.virtual("listName").get(function getListName() {
  return this.listInfo?.name ?? null;
});

// Bật virtuals và ẩn field join tạm
TaskSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.listInfo;
    return ret;
  },
});

TaskSchema.set("toObject", {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.listInfo;
    return ret;
  },
});

// Tự động join sang bảng list khi query Task
TaskSchema.pre(/^find/, function autoPopulateList(next) {
  this.populate({
    path: "listInfo",
    select: "name",
    match: { deletedAt: null },
  });
  next();
});

export default mongoose.model("Task", TaskSchema);
