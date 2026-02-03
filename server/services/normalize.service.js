const SOURCE_NAME = process.env.JOB_SOURCE_NAME || "jobicy";

function normalizeJob(item, sourceUrl) {
  return {
    externalId: `${SOURCE_NAME}-${item?.guid || item?.link || ""}`,
    source: SOURCE_NAME,
    sourceUrl,
    title: item?.title || "",
    company: item?.["job_listing:company"] || "",
    location: item?.["job_listing:location"] || "",
    jobUrl: item?.link || "",
    postedAt: item?.pubDate ? new Date(item.pubDate).toISOString() : null,
  };
}

module.exports = {
  normalizeJob,
};
