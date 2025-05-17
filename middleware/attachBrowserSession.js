import { getBrowser, getPageForURL } from "../services/browserManager.js";
import createLogger from "../utils/logger.js";
import cache from "memory-cache";

const logger = createLogger("middleware/attachBrowserSession");

const allowedDomains = [""]; // Replace with your actual allowed domains

const isValidURL = (url) => {
  try {
    const parsedUrl = new URL(url);
    return allowedDomains.some((domain) => parsedUrl.hostname.endsWith(domain));
  } catch {
    return false;
  }
};

const attachBrowserSession = (type = 'matchOdds') => {
  return async (req, res, next) => {
    try {
      const browser = getBrowser();
      if (!browser) {
        logger.error('Browser not initialized', { action: 'attachBrowserSession' });
        return res.status(500).json({ error: 'Browser session not initialized' });
      }

      const url = req.body?.url;
      if (url && !isValidURL(url)) {
        logger.warn('Blocked invalid URL', { action: 'attachBrowserSession', url });
        return res.status(400).json({ error: 'Invalid or unauthorized URL' });
      }

      let page;
      if (url) {
        page = await getPageForURL(url, type); // 👈 use route-specific type
      } else {
        page = cache.get('defaultPage');
        if (!page) {
          logger.warn('Default page not found in cache', { action: 'attachBrowserSession' });
          return res.status(500).json({ error: 'Default page not initialized yet' });
        }
        logger.info('Using default page for session', { action: 'attachBrowserSession' });
      }

      req.browser = browser;
      req.page = page;
      logger.info('Browser session attached', { action: 'attachBrowserSession', url });
      next();
    } catch (err) {
      logger.error('Failed to attach browser session', {
        action: 'attachBrowserSession',
        reason: err.message,
        stack: err.stack
      });
      res.status(500).json({ error: 'Failed to attach browser session' });
    }
  };
};

export default attachBrowserSession;
