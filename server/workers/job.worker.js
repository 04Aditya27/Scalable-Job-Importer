require("dotenv").config();

const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const mongoose = require("mongoose");

const Job = require("../models/Job");
const ImportLog = require("../models/ImportLog");

const importLogService = require("../services/importLog.service");
const feedService = require("../services/feed.service");
const { normalizeJob } = require("../services/normalize.service");
const { addJobsToQueue } = require("../queue/job.queue");

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Worker MongoDB connected"))
  .catch((err) => {
    console.error("Worker MongoDB error:", err);
    process.exit(1);
  });

const connection = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

const QUEUE_NAME = process.env.JOB_IMPORT_QUEUE_NAME || "job-import-queue";
const CONCURRENCY = Number(process.env.JOB_WORKER_CONCURRENCY) || 5;

const worker = new Worker(
  QUEUE_NAME,
  async (jobData) => {
    if (jobData.name === "run-import-cron") {
      const feedUrls = process.env.JOB_FEED_URLS
        ? process.env.JOB_FEED_URLS.split(",")
        : [];

      console.log(`⏰ Running scheduled import for ${feedUrls.length} feeds`);

      for (const feedUrl of feedUrls) {
        const importLog = await importLogService.createImportLog(feedUrl);

        const feedResult = await feedService.fetchJobsFromFeed(feedUrl);

        if (!feedResult.success) {
          await importLogService.markImportFailed(
            importLog._id,
            feedResult.errorCode,
          );
          continue;
        }

        const jobs = feedResult.jobs;

        if (!jobs || jobs.length === 0) {
          await importLogService.markImportFailed(
            importLog._id,
            "NO_JOBS_FOUND",
          );
          continue;
        }

        await importLogService.updateTotalFetched(importLog._id, jobs.length);

        const normalizedJobs = jobs.map((job) => normalizeJob(job, feedUrl));

        await addJobsToQueue(importLog._id.toString(), normalizedJobs);
      }

      return;
    }

    const { importRunId, job } = jobData.data;

    try {
      if (!job.externalId || !job.title || !job.jobUrl) {
        throw new Error("Missing required fields");
      }

      const result = await Job.updateOne(
        { externalId: job.externalId },
        {
          $set: {
            source: job.source,
            location: job.location,
            sourceUrl: job.sourceUrl,
            title: job.title,
            company: job.company,
            jobUrl: job.jobUrl,
            postedAt: job.postedAt,
            description: job.description || "",
          },
        },
        { upsert: true },
      );

      const isNewJob = result.upsertedCount > 0;

      await ImportLog.findByIdAndUpdate(importRunId, {
        $inc: {
          totalImported: 1,
          newJobs: isNewJob ? 1 : 0,
          updatedJobs: isNewJob ? 0 : 1,
        },
      });
    } catch (error) {
      await ImportLog.findByIdAndUpdate(importRunId, {
        $inc: { totalImported: 1 },
        $push: {
          failedJobs: {
            externalId: job?.externalId || "unknown",
            reason: error.message,
          },
        },
      });

      throw error;
    }
  },
  {
    connection,
    concurrency: CONCURRENCY,
  },
);

worker.on("completed", (job) => {
  console.log(`Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job failed: ${job?.id}`, err.message);
});
