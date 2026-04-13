import Task from "../models/task.js";
import TaskList from "../models/list.js";

export async function getOwnedListIds(userId) {
  const lists = await TaskList.find({
    userId,
    deletedAt: null,
  }).select("_id");

  return lists.map((list) => list._id);
}

export async function getOwnedListOrNull(userId, listId) {
  const list = await TaskList.findOne({
    _id: listId,
    userId,
    deletedAt: null,
  });

  return list || null;
}

export async function getOwnedTaskOrNull(userId, taskId) {
  const task = await Task.findById(taskId);

  if (!task?.listInfo || task.deletedAt) {
    return null;
  }

  if (String(task.listInfo.userId) !== String(userId)) {
    return null;
  }

  return task;
}
