const ImportLog = require("../models/ImportLog");

async function createImportLog(sourceUrl) {
  return ImportLog.create({ sourceUrl });
}

async function updateTotalFetched(importLogId, totalFetched) {
  await ImportLog.findByIdAndUpdate(
    importLogId,
    {
      $set: { totalFetched },
    },
    { new: true },
  );
}

async function markImportFailed(importLogId, reason) {
  await ImportLog.findByIdAndUpdate(
    importLogId,
    {
      $set: { finishedAt: new Date() },
      $push: {
        failedJobs: {
          externalId: null,
          reason,
        },
      },
    },
    { new: true },
  );
}

module.exports = {
  createImportLog,
  updateTotalFetched,
  markImportFailed,
};
