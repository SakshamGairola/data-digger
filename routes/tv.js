import express from 'express';
import attachBrowserSession from '../middleware/attachBrowserSession.js';
import createLogger from '../utils/logger.js';
import { getPageForURL } from '../services/browserManager.js';

const logger = createLogger('tv');
const router = express.Router();

router.post('/', attachBrowserSession('tv'), async (req, res) => {
  const { url } = req.body;

	try {
		const page = await getPageForURL(url, 'tv');
		await new Promise((resolve) => setTimeout(resolve, 1000));
		const elementHandle = await page.$('div.sidebar-box:first-of-type');
		let iframeCount = 0;
		if (elementHandle) {
			// Extract class names and check if it only contains "sidebar-box"
			const classNames = await elementHandle.evaluate((el) => el.className);
			const classList = classNames.split(/\s+/);

			const tvExists = classList.length === 1 && classList[0] === 'sidebar-box';

			if (!tvExists) {
				return res.status(410).json({ message: 'TV is not available' });
			}

			// Count child elements
			iframeCount = await elementHandle.evaluate((el) => el.children.length);
		}

    if (iframeCount == 2) {
      await page.evaluate(() => {
        const trigger = document.querySelector('div.sidebar-box:first-of-type > div.sidebar-title') ||
                        document.querySelector('.fa-tv')?.closest('a');
        trigger?.click();
      });
      await new Promise(r => setTimeout(r, 500));
      await page.evaluate(() => {
        const trigger = document.querySelector('div.sidebar-box:first-of-type > div.sidebar-title') ||
                        document.querySelector('.fa-tv')?.closest('a');
        trigger?.click();
      });
    } else {
      await page.evaluate(() => {
        const trigger = document.querySelector('div.sidebar-box:first-of-type > div.sidebar-title') ||
                        document.querySelector('.fa-tv')?.closest('a');
        trigger?.click();
      });
    }

    await page.waitForSelector('div.live-tv iframe', { visible: true, timeout: 10000 });
    const tvUrl = await page.evaluate(() => document.querySelector('div.live-tv iframe')?.src || null);

    if (!tvUrl) {
      return res.status(404).json({ error: 'TV iframe not found' });
    }

    res.status(200).json({ tvUrl });
  } catch (err) {
    if (err.message === 'retry_later') {
      return res.status(202).json({ retry: true, message: 'Page is being initialized. Retry shortly.' });
    }
    logger.error('Failed to load TV iframe', { url: req.body.url, reason: err.message });
    res.status(500).json({ error: 'Failed to load TV iframe' });
  }
});

export default router;
