const ImportLog = require("../models/ImportLog");

async function getImportLogs(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const query = {};

    if (status) {
      if (status === "failed") {
        query.$expr = {
          $eq: [{ $add: ["$newJobs", "$updatedJobs"] }, 0],
        };
      } else if (status === "success") {
        query.failedJobs = { $size: 0 };
        query.$expr = {
          $gt: [{ $add: ["$newJobs", "$updatedJobs"] }, 0],
        };
      } else if (status === "partial") {
        query["failedJobs.0"] = { $exists: true };
        query.$expr = {
          $gt: [{ $add: ["$newJobs", "$updatedJobs"] }, 0],
        };
      }
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ImportLog.find(query).sort({ startedAt: -1 }).skip(skip).limit(limit),
      ImportLog.countDocuments(query),
    ]);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Failed to fetch import logs:", err);
    res.status(500).json({ error: "Failed to fetch import logs" });
  }
}

module.exports = { getImportLogs };
