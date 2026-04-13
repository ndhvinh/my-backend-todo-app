import Task from "../models/task.js";
import {
  getOwnedListIds,
  getOwnedListOrNull,
  getOwnedTaskOrNull,
} from "../services/taskService.js";

export async function getTasks(req, res) {
  try {
    const listIds = await getOwnedListIds(req.user.id);

    const tasks = await Task.find({
      deletedAt: null,
      listId: { $in: listIds },
    }).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error("❌ Error fetching tasks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getTasksByList(req, res) {
  try {
    const { listId } = req.params;
    const { search } = req.query;

    const list = await getOwnedListOrNull(req.user.id, listId);
    if (!list) {
      return res.status(404).json({ error: "List not found" });
    }

    const filter = {
      listId,
      deletedAt: null,
    };

    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error("❌ Error fetching tasks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getCompletedTasks(req, res) {
  try {
    const listIds = await getOwnedListIds(req.user.id);
    const tasks = await Task.find({ listId: { $in: listIds } }).sort({
      createdAt: -1,
    });
    res.json(tasks);
  } catch (error) {
    console.error("❌ Error fetching completed tasks:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function createTask(req, res) {
  try {
    const list = await getOwnedListOrNull(req.user.id, req.body.listId);

    if (!list) {
      return res.status(404).json({ error: "List not found" });
    }

    const task = new Task(req.body);
    await task.save();
    await task.populate({
      path: "listInfo",
      select: "name userId deletedAt",
      match: { deletedAt: null },
    });
    res.json(task);
  } catch (error) {
    console.error("❌ Error creating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateTask(req, res) {
  try {
    const task = await getOwnedTaskOrNull(req.user.id, req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const { title, text, checklist } = req.body;
    task.title = title ?? task.title;
    task.text = text ?? task.text;
    task.checklist = checklist ?? task.checklist;

    await task.save();

    res.json(task);
  } catch (error) {
    console.error("❌ Error updating task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteTask(req, res) {
  try {
    const task = await getOwnedTaskOrNull(req.user.id, req.params.id);

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    task.deletedAt = new Date();
    await task.save();
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting task:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getTaskDetail(req, res) {
  try {
    const detail = await getOwnedTaskOrNull(req.user.id, req.params.id);

    if (!detail) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.json(detail);
  } catch (error) {
    console.error("❌ Error fetching task detail:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
