const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
});

const QUEUE_NAME = process.env.JOB_IMPORT_QUEUE_NAME || "job-import-queue";
const ATTEMPTS = Number(process.env.JOB_QUEUE_ATTEMPTS) || 3;
const BACKOFF_DELAY = Number(process.env.JOB_QUEUE_BACKOFF_MS) || 2000;

const jobImportQueue = new Queue(QUEUE_NAME, { connection });

const BATCH_SIZE = Number(process.env.JOB_IMPORT_BATCH_SIZE) || 10;

async function addJobsToQueue(importRunId, jobs) {
  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);

    await jobImportQueue.addBulk(
      batch.map((job) => ({
        name: "import-job",
        data: {
          importRunId,
          job,
        },
        opts: {
          attempts: ATTEMPTS,
          backoff: {
            type: "exponential",
            delay: BACKOFF_DELAY,
          },
          removeOnComplete: true,
          removeOnFail: false,
        },
      })),
    );
  }
}

module.exports = {
  addJobsToQueue,
};
