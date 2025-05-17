import express from "express";
import attachBrowserSession from "../middleware/attachBrowserSession.js";
import createLogger from "../utils/logger.js";

const logger = createLogger("sports");
const router = express.Router();

router.get("/", attachBrowserSession('generic'), async (req, res) => {
  const { page } = req;
  logger.info("Received GET /api/games request", { action: "fetch sports" });

  try {
    // await page.waitForSelector("div.accordion:nth-of-type(3) ul.navbar-nav", {
    //   visible: true,
    //   timeout: 10000,
    // });

    const sports = await page.evaluate(() => {
      const scrappedSports = {};
      const allSports = $("div.accordion:nth-of-type(3) ul.navbar-nav");
      allSports.map((_, sport) => {
        const sportName =
          $(sport).find("a:first > span").text().trim() ?? "Unknown Sport";
        if (!scrappedSports[sportName]) scrappedSports[sportName] = {};
        const allSeries = $(sport).find("li:first>ul");
        allSeries.map((_, series) => {
          const seriesName =
            $(series).find("a:first > span").text().trim() ?? "Unknown Series";
          const matchArr = [];
          const matches = $(series).find("ul.dropdown-menu>li");
          matches.map((_, match) => {
            const matchName = $(match).find("a").text();
            const matchUrl = $(match).find("a")[0].href;
            if (matchName && matchUrl) matchArr.push({ [matchName]: matchUrl });
          });
          scrappedSports[sportName][seriesName] = matchArr;
        });
      });
      return scrappedSports;
    });

    logger.info("Scraped sports successfully", { action: "scrape sports" });
    res.status(200).json(sports);
  } catch (err) {
    logger.error("Failed to scrape sports", {
      action: "scrape sports",
      reason: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: "Something went wrong during scraping." });
  }
});

export default router;
