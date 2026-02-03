const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
});

const QUEUE_NAME = process.env.JOB_IMPORT_QUEUE_NAME || "job-import-queue";

const CRON_PATTERN = process.env.JOB_IMPORT_CRON || "0 * * * *";

const queue = new Queue(QUEUE_NAME, { connection });

async function setupImportCron() {
  const repeatableJobs = await queue.getRepeatableJobs();

  for (const job of repeatableJobs) {
    await queue.removeRepeatableByKey(job.key);
  }

  await queue.add(
    "run-import-cron",
    {
      trigger: "cron",
    },
    {
      repeat: {
        cron: CRON_PATTERN,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );

  console.log(`Import cron scheduled: ${CRON_PATTERN}`);
}

module.exports = {
  setupImportCron,
};
