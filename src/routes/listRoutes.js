import express from "express";
import TaskList from "../models/list.js";
import Task from "../models/task.js";

const router = express.Router();

// Lấy danh sách list
router.get("/", async (req, res) => {
  try {
    const list = await TaskList.find({
      deletedAt: null,
    }).sort({ createdAt: 1 });

    if (list.length < 1) throw new Error("No lists found");
    res.json(list);
  } catch (error) {
    console.error("❌ Error creating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Lấy danh sách list, trả về tên
router.get("/name", async (req, res) => {
  try {
    const list = await TaskList.find({
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .select("name");

    if (list.length < 1) throw new Error("No lists found");
    res.json(list);
  } catch (error) {
    console.error("❌ Error creating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Lấy chi tiết
router.get("/detail", async (req, res) => {
  const list = await TaskList.find({
    deletedAt: null,
  }).populate("tasks");
  res.json(list);
});

// Tạo list
router.post("/", async (req, res) => {
  try {
    const list = new TaskList(req.body);
    await list.save();
    res.json(list);
  } catch (error) {
    console.error("❌ Error creating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Chỉnh sửa list
router.patch("/:id", async (req, res) => {
  try {
    const updated = await TaskList.findByIdAndUpdate(
      { _id: req.params.id },
      { name: req.body.name },
      { new: true },
    );
    res.json(updated);
  } catch (error) {
    console.error("❌ Error creating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Xoá list
router.delete("/:id", async (req, res) => {
  try {
    await TaskList.findByIdAndUpdate(req.params.id, {
      deletedAt: new Date(),
    });
    // Xoá task trong list
    await Task.updateMany({ listId: req.params.id }, { deletedAt: new Date() });
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("❌ Error creating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
export default router;
