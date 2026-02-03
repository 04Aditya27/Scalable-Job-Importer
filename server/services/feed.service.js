const axios = require("axios");
const xml2js = require("xml2js");

const FEED_TIMEOUT = Number(process.env.JOB_FEED_TIMEOUT_MS) || 15000;
const USER_AGENT =
  process.env.JOB_FEED_USER_AGENT || "Mozilla/5.0 (JobImporter/1.0)";

async function fetchJobsFromFeed(feedUrl) {
  try {
    const response = await axios.get(feedUrl, {
      timeout: FEED_TIMEOUT,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
      },
    });

    const xmlData = response.data;

    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: true,
    });

    const jsonData = await parser.parseStringPromise(xmlData);

    const items = jsonData?.rss?.channel?.item || [];
    const jobs = Array.isArray(items) ? items : [items];

    return {
      success: true,
      jobs,
    };
  } catch (error) {
    return {
      success: false,
      errorCode:
        error.response?.status === 522 ? "FEED_TIMEOUT" : "FEED_FETCH_FAILED",
      errorMessage: error.message,
    };
  }
}

module.exports = {
  fetchJobsFromFeed,
};
