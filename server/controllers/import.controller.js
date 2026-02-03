const importLogService = require("../services/importLog.service");
const feedService = require("../services/feed.service");
const { normalizeJob } = require("../services/normalize.service");
const { addJobsToQueue } = require("../queue/job.queue");

async function runImport(req, res) {
  try {
    let { sourceUrl, sourceUrls } = req.body;

    if (sourceUrls && Array.isArray(sourceUrls)) {
    } else if (sourceUrl) {
      sourceUrls = [sourceUrl];
    } else {
      sourceUrls = process.env.JOB_FEED_URLS
        ? process.env.JOB_FEED_URLS.split(",")
        : [];
    }

    if (!sourceUrls || sourceUrls.length === 0) {
      return res.status(400).json({
        error: "No feed URLs provided",
      });
    }

    const results = [];

    for (const feedUrl of sourceUrls) {
      const importLog = await importLogService.createImportLog(feedUrl);

      const feedResult = await feedService.fetchJobsFromFeed(feedUrl);

      if (!feedResult.success) {
        await importLogService.markImportFailed(
          importLog._id,
          feedResult.errorCode,
        );

        results.push({
          sourceUrl: feedUrl,
          importRunId: importLog._id,
          status: "failed",
          reason: feedResult.errorCode,
        });

        continue;
      }

      const jobs = feedResult.jobs;
      const totalFetched = jobs.length;

      if (totalFetched === 0) {
        await importLogService.markImportFailed(importLog._id, "NO_JOBS_FOUND");

        results.push({
          sourceUrl: feedUrl,
          importRunId: importLog._id,
          status: "failed",
          reason: "NO_JOBS_FOUND",
        });

        continue;
      }

      await importLogService.updateTotalFetched(importLog._id, totalFetched);

      const normalizedJobs = jobs.map((job) => normalizeJob(job, feedUrl));

      await addJobsToQueue(importLog._id.toString(), normalizedJobs);

      results.push({
        sourceUrl: feedUrl,
        importRunId: importLog._id,
        status: "queued",
        totalFetched,
      });
    }

    return res.status(201).json({
      message: "Import triggered",
      results,
    });
  } catch (error) {
    console.error("Import failed:", error);
    return res.status(500).json({ error: "Failed to run import" });
  }
}

module.exports = {
  runImport,
};
