import { getBrowser, getPage } from '../services/browserManager.js';

const attachBrowserSession = (req, res, next) => {
    const browser = getBrowser();
    const page = getPage();

    if (!browser || !page) {
        return res.status(500).json({ error: 'Browser session not initialized' });
    }

    req.browser = browser;
    req.page = page;
    next();
};

export default attachBrowserSession;
