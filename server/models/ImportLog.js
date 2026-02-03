const mongoose = require("mongoose");

const ImportLogSchema = new mongoose.Schema({
  sourceUrl: {
    type: String,
    required: true,
  },

  startedAt: {
    type: Date,
    default: Date.now,
  },

  finishedAt: {
    type: Date,
    default: null,
  },

  totalFetched: {
    type: Number,
    default: 0,
  },

  totalImported: {
    type: Number,
    default: 0,
  },

  newJobs: {
    type: Number,
    default: 0,
  },

  updatedJobs: {
    type: Number,
    default: 0,
  },

  failedJobs: {
    type: [
      {
        externalId: String,
        reason: {
          type: String,
          enum: [
            "FEED_TIMEOUT",
            "FEED_FETCH_FAILED",
            "XML_PARSE_ERROR",
            "NO_JOBS_FOUND",
          ],
        },
      },
    ],
    default: [],
  },
});

module.exports = mongoose.model("ImportLog", ImportLogSchema);
