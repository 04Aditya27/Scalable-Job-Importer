const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    source: String,
    sourceUrl: String,

    title: String,
    company: String,
    jobUrl: String,
    postedAt: Date,
    description: String,
    location: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Job", JobSchema);
