import express from "express";
import Task from "../models/task.js";

const router = express.Router();

// Lấy tất cả task
router.get("/", async (req, res) => {
  const tasks = await Task.find({
    deletedAt: null,
  }).sort({ createdAt: -1 });
  res.json(tasks);
});

// Lấy danh sách task theo listId + filter text
router.get("/list/:listId", async (req, res) => {
  try {
    const { listId } = req.params;
    const { search } = req.query;

    const filter = {
      listId,
      deletedAt: null,
    };

    // Nếu có query search thì filter theo title (không phân biệt hoa thường)
    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error("❌ Error fetching tasks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Lấy các task bao gồm đã xóa
router.get("/completed", async (req, res) => {
  const tasks = await Task.find({ completed: true }).sort({ createdAt: -1 });
  res.json(tasks);
});

// Thêm task mới
router.post("/", async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    await task.populate({
      path: "listInfo",
      select: "name",
      match: { deletedAt: null },
    });
    res.json(task);
  } catch (error) {
    console.error("❌ Error creating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Chỉnh sửa task
router.patch("/:id", async (req, res) => {
  const { title, text, checklist } = req.body;
  const updated = await Task.findByIdAndUpdate(
    req.params.id,
    { title, text, checklist },
    { new: true },
  );
  res.json(updated);
});

// Xóa task
router.delete("/:id", async (req, res) => {
  await Task.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
  res.json({ message: "Deleted successfully" });
});

// Lấy task theo id
router.get("/:id", async (req, res) => {
  const detail = await Task.findById(req.params.id);
  res.json(detail);
});

export default router;
