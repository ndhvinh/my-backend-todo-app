import TaskList from "../models/list.js";
import Task from "../models/task.js";

export async function getLists(req, res) {
  try {
    const list = await TaskList.find({
      deletedAt: null,
      userId: req.user.id,
    }).sort({ createdAt: 1 });

    res.json(list);
  } catch (error) {
    console.error("❌ Error fetching list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getListNames(req, res) {
  try {
    const list = await TaskList.find({
      deletedAt: null,
      userId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .select("name");

    res.json(list);
  } catch (error) {
    console.error("❌ Error fetching list names:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getListDetail(req, res) {
  try {
    const list = await TaskList.find({
      deletedAt: null,
      userId: req.user.id,
    }).populate("tasks");
    res.json(list);
  } catch (error) {
    console.error("❌ Error fetching list detail:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function createList(req, res) {
  try {
    const list = new TaskList({
      ...req.body,
      userId: req.user.id,
    });
    await list.save();
    res.json(list);
  } catch (error) {
    console.error("❌ Error creating list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateList(req, res) {
  try {
    const updated = await TaskList.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, deletedAt: null },
      { name: req.body.name, color: req.body.color },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ error: "List not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("❌ Error updating list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteList(req, res) {
  try {
    const list = await TaskList.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user.id,
        deletedAt: null,
      },
      {
        deletedAt: new Date(),
      },
      { new: true },
    );

    if (!list) {
      return res.status(404).json({ error: "List not found" });
    }

    await Task.updateMany({ listId: req.params.id }, { deletedAt: new Date() });
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting list:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
