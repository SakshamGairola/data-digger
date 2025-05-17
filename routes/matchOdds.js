import express from "express";
import attachBrowserSession from "../middleware/attachBrowserSession.js";
import createLogger from '../utils/logger.js';
import { getPageForURL } from '../services/browserManager.js';

const logger = createLogger('matchOdds');
const router = express.Router();

router.post("/", attachBrowserSession('matchOdds'), async (req, res) => {
	const { url } = req.body;

	logger.info('Received POST /api/games/odds request', { action: 'scrape match odds', url });

	try {
		const page = await getPageForURL(url, 'matchOdds');
		await page.waitForSelector('div.game-market', { visible: true, timeout: 10000 });

		const matchOdds = await page.evaluate(() => {
			marketData = {};
			document.querySelectorAll("div.game-market").forEach((marketEl) => {
				const market = {};
				const titleEl = marketEl.querySelector(".market-title span");
				const headerEl = marketEl.querySelector(
					".market-header .market-nation-name"
				);

				const title = titleEl ? titleEl.textContent.trim() : "";
				const hdrText = headerEl ? headerEl.textContent.trim() : "";

				if (hdrText) {
					const minMax = {};
					hdrText.split(/\s{2,}|\u00a0/).forEach((part) => {
						const [k, v] = part.split(":").map((s) => s.trim());
						if (k && v) minMax[k.toLowerCase()] = v;
					});
					market.limits = minMax;
				}

				const rows = [];
				marketEl
					.querySelectorAll(".market-body .market-row")
					.forEach((rowEl) => {
						const row = {
							state: rowEl.getAttribute("data-title"),
							name:
								rowEl
									.querySelector(".market-nation-name")
									?.textContent.trim() || "",
							odds: {},
						};

						rowEl.querySelectorAll(".market-odd-box").forEach((oddBoxEl) => {
							const classes = oddBoxEl.className.split(/\s+/);
							const key =
								classes.find(
									(c) =>
										/^back\d*$/.test(c) ||
										/^lay\d*$/.test(c) ||
										c === "back" ||
										c === "lay"
								) || "other";

							row.odds[key] = {
								odd:
									oddBoxEl.querySelector(".market-odd")?.textContent.trim() ||
									null,
								volume:
									oddBoxEl
										.querySelector(".market-volume")
										?.textContent.trim() || null,
							};
						});

						rows.push(row);
					});

				market.rows = rows;
				marketData[title] = market;
			});

			return marketData;
		});

		logger.info('Scraped match odds successfully', { action: 'scrape match odds' });
		res.status(200).json(matchOdds);

	} catch (err) {
		logger.error('Failed to scrape match odds', {
			action: 'scrape match odds',
			url,
			reason: err.message,
			stack: err.stack
		});
		res.status(500).json({ error: 'Something went wrong during scraping.' });
	}
});

export default router;
