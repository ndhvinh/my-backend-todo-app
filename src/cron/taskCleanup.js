import cron from "node-cron";
import Task from "../models/task.js";

const THIRTY_DAYS_IN_MS = 30 * 24 * 60 * 60 * 1000;
const CLEANUP_SCHEDULE = process.env.TASK_CLEANUP_CRON || "10 0 * * *";

export const startTaskCleanupCron = () => {
  if (!cron.validate(CLEANUP_SCHEDULE)) {
    console.error(`❌ Invalid cron expression: ${CLEANUP_SCHEDULE}`);
    return;
  }

  cron.schedule(CLEANUP_SCHEDULE, async () => {
    try {
      const cutoffDate = new Date(Date.now() - THIRTY_DAYS_IN_MS);

      const result = await Task.deleteMany({
        deletedAt: { $ne: null, $lte: cutoffDate },
      });

      console.log(
        `🧹 Cron cleanup tick: deleted ${result.deletedCount} old tasks.`,
      );
    } catch (error) {
      console.error("❌ Cron cleanup error:", error);
    }
  });

  console.log(
    `⏰ Task cleanup cron started with schedule: ${CLEANUP_SCHEDULE}`,
  );
};
