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

    const iframeExists = await page.$('div.live-tv iframe');

    if (iframeExists) {
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
