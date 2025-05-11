import express from 'express';
import initBrowserSession from '../middleware/initBrowserSession.js';

const router = express.Router();

router.get('/', initBrowserSession, async (req, res) => {
	const { browser, page } = req;
	try {
		const sports = await page.evaluate(() => {
			const scrappedSports = {};
			const allSports = $('div.accordion:nth-of-type(3) ul.navbar-nav');
			allSports.map((_, sport) => {
				const sportName = $(sport).find('a:first > span').text().trim() ?? 'Unknown Sport';
				if (!scrappedSports[sportName]) scrappedSports[sportName] = {};
				const allSeries = $(sport).find('li:first>ul');
				allSeries.map((_, series) => {
					const seriesName = $(series).find('a:first > span').text().trim() ?? 'Unknown Series';
					const matchArr = [];
					const matches = $(series).find('ul.dropdown-menu>li');
					matches.map((_, match) => {
						const matchName = $(match).find('a').text();
						const matchUrl = $(match).find('a')[0].href;
						if (matchName && matchUrl) matchArr.push({ [matchName]: matchUrl });
					});
					scrappedSports[sportName][seriesName] = matchArr;
				});
			});
			return scrappedSports;
		});
		await browser.close();
		res.status(200).json(sports);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Something went wrong during scraping.' });
	}
});

export default router;
