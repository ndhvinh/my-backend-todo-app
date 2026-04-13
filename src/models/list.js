import mongoose from "mongoose";

const TaskListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    color: { type: String },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Virtual populate - tự động lấy tasks liên quan
TaskListSchema.virtual("tasks", {
  ref: "Task", // Model tham chiếu
  localField: "_id", // Field trong TaskList
  foreignField: "listId", // Field trong Task trỏ về TaskList
  options: { sort: { createdAt: -1 } }, // Sắp xếp mới nhất trước
});

// Bật virtuals khi convert sang JSON/Object
TaskListSchema.set("toJSON", { virtuals: true });
TaskListSchema.set("toObject", { virtuals: true });

export default mongoose.model("TaskList", TaskListSchema);
