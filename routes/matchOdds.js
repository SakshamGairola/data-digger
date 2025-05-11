import express from 'express';
import initBrowserSession from '../middleware/initBrowserSession.js';

const router = express.Router();

router.post('/', initBrowserSession, async (req, res) => {
	const { browser, page } = req;
	const { url } = req.body;

	try {
		await page.goto(url, { waitUntil: 'networkidle0' });

		const matchOdds = await page.evaluate(() => {
			const marketData = {};
			$('div.game-market').each(function () {
				const $m = $(this);
				const market = {};
				const title = $m.find('.market-title span').first().text().trim();
				const hdrText = $m.find('.market-header .market-nation-name').first().text().trim();

				if (hdrText) {
					const minMax = {};
					hdrText.split(/\s{2,}| /).forEach((part) => {
						const [k, v] = part.split(':').map((s) => s.trim());
						if (k && v) minMax[k.toLowerCase()] = v;
					});
					market.limits = minMax;
				}

				market.rows = $m.find('.market-body .market-row').map(function () {
					const $r = $(this);
					const row = {
						state: $r.data('title'),
						name: $r.find('.market-nation-name').first().text().trim(),
						odds: {},
					};
					$r.find('.market-odd-box').each(function () {
						const classes = $(this).attr('class').split(/\s+/);
						const key =
							classes.find(c => /^back\d*$/.test(c) || /^lay\d*$/.test(c) || c === 'back' || c === 'lay') || 'other';
						row.odds[key] = {
							odd: $(this).find('.market-odd').text().trim() || null,
							volume: $(this).find('.market-volume').text().trim() || null,
						};
					});
					return row;
				}).get();

				marketData[title] = market;
			});
			return marketData;
		});

		await browser.close();
		res.status(200).json(matchOdds);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Something went wrong during scraping.' });
	}
});

export default router;
