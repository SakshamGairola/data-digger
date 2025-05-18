import express from "express";
import attachBrowserSession from "../middleware/attachBrowserSession.js";
import createLogger from "../utils/logger.js";

const logger = createLogger("sports");
const router = express.Router();

router.get("/", attachBrowserSession('generic'), async (req, res) => {
  const { page } = req;
  logger.info("Received GET /api/games request", { action: "fetch sports" });

  try {
    const sports = await page.evaluate(() => {
      scrappedSports = {};
      allSports = document.querySelectorAll("div.accordion:nth-of-type(3) ul.navbar-nav");
      allSports.forEach(sportList => {
        const sports = sportList.querySelectorAll(":scope > li");

        sports.forEach(sport => {
          const sportNameElem = sport.querySelector("a > span");
          const sportName = sportNameElem?.textContent.trim() || "Unknown Sport";
          if (!scrappedSports[sportName]) scrappedSports[sportName] = {};

          const seriesList = sport.querySelectorAll(":scope > ul > li");

          seriesList.forEach(series => {
            const seriesNameElem = series.querySelector("a > span");
            const seriesName = seriesNameElem?.textContent.trim() || "Unknown Series";
            const matchArr = [];

            const matches = series.querySelectorAll("ul.dropdown-menu > li");

            matches.forEach(match => {
              const anchor = match.querySelector("a");
              const matchName = anchor?.textContent.trim();
              const matchUrl = anchor?.href;

              if (matchName && matchUrl) {
                matchArr.push({ [matchName]: matchUrl });
              }
            });

            scrappedSports[sportName][seriesName] = matchArr;
          });
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
