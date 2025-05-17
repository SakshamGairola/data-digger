import express from 'express';
import initBrowserSession from '../middleware/attachBrowserSession.js';

const router = express.Router();

router.post('/', initBrowserSession, async (req, res) => {
	const { browser, page } = req;
	const { url } = req.body;

	try {
		await page.goto(url, { waitUntil: 'domcontentloaded' });
		await new Promise(resolve => setTimeout(resolve, 500));

		await page.evaluate(() => {
			const parent = $('div.sidebar-box:first-of-type > div.sidebar-title');
			if (parent.length) {
				parent.click();
			} else {
				$('.fa-tv').parent()[0].click();
			}
		});
		await new Promise(resolve => setTimeout(resolve, 500));

		const tvUrl = await page.evaluate(() => {
			const iframe = $('div.live-tv iframe');
			return $(iframe).attr('src');
		});

		await browser.close();
		res.status(200).json({ tvUrl });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Something went wrong during scraping.', message: err.message });
	}
});

export default router;
