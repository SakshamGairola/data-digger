import puppeteer from 'puppeteer-extra';
import cache from 'memory-cache';
import { LRUCache } from 'lru-cache';
import { getBrowserConfig } from '../config/browserConfig.js';
import createLogger from '../utils/logger.js';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

const logger = createLogger('browserManager');

const BROWSER_KEY = 'browser';
const DEFAULT_PAGE_KEY = 'defaultPage';
const urlPageMap = new LRUCache({
	max: 20,
	dispose: (value, key) => {
		logger.info('Evicting page from cache', { url: key });
		value.close().catch((err) => logger.error('Error closing page', { reason: err.message }));
	},
});

const pageInitLocks = new Map();

export const initBrowser = async () => {
	if (cache.get(BROWSER_KEY)) return;

	puppeteer.use(StealthPlugin());

	const browser = await puppeteer.launch(getBrowserConfig());
	cache.put(BROWSER_KEY, browser);

	const page = await browser.newPage();
	cache.put(DEFAULT_PAGE_KEY, page);

	const loginUrl = process.env.URL;
	if (!loginUrl) throw new Error('Missing process.env.URL');

	try {
		await page.goto(loginUrl, {
			waitUntil: 'domcontentloaded',
			timeout: 20000,
		});
		await loginToSite(page);
		logger.info('Browser initialized and logged in', { loginUrl });
	} catch (err) {
		logger.error('Failed during initBrowser navigation', {
			reason: err.message,
			stack: err.stack,
		});
	}
};

const loginToSite = async (page) => {
	const URL = process.env.URL;
	await page.goto(URL, { waitUntil: 'domcontentloaded' });
	const loginForm = await page.$('input[name="username"]');
	if (loginForm) {
		await page.type('input[name="username"]', process.env.LOGIN_USERNAME);
		await page.type('input[name="password"]', process.env.PASSWORD);
		await page.click('div.d-grid button');
		await page.waitForNavigation({ waitUntil: 'domcontentloaded' });
	}
};

export const getBrowser = () => cache.get(BROWSER_KEY);

export const getPageForURL = async (url, type = 'matchOdds') => {
	const browser = getBrowser();
	if (!browser) throw new Error('Browser not initialized');

	let page = urlPageMap.get(url);
	if (page) {
		try {
			await page.title();
			logger.info('Reusing cached page', { url });
			return page;
		} catch {
			logger.warn('Cached page crashed, reopening...', { url });
			urlPageMap.delete(url);
		}
	}

	if (pageInitLocks.has(url)) {
		if (type === 'matchOdds') {
			logger.info('matchOdds waiting for lock', { url });
			await pageInitLocks.get(url);
			return urlPageMap.get(url);
		} else {
			logger.warn('tv should retry later', { url });
			throw new Error('retry_later');
		}
	}

	let resolveLock, rejectLock;
	const lockPromise = new Promise((resolve, reject) => {
		resolveLock = resolve;
		rejectLock = reject;
	});
	pageInitLocks.set(url, lockPromise);

	try {
		logger.info('Opening new page', { url, type });
		page = await browser.newPage();
		await loginToSite(page);
		await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

		if (type === 'matchOdds') {
			try {
				await page.waitForSelector('div.game-market', {
					visible: true,
					timeout: 10000,
				});
				logger.info('Selector .game-market loaded', { url });
			} catch (err) {
				logger.warn('Selector .game-market not found in time', {
					url,
					reason: err.message,
				});
			}
		}

		urlPageMap.set(url, page);
		resolveLock();
		return page;
	} catch (err) {
		rejectLock(err);
		throw err;
	} finally {
		pageInitLocks.delete(url);
	}
};

export const closeBrowser = async () => {
	const browser = getBrowser();
	if (!browser) return;
	for (const [url, page] of urlPageMap.entries()) {
		await page.close();
	}
	urlPageMap.clear();
	const defaultPage = cache.get(DEFAULT_PAGE_KEY);
	if (defaultPage) await defaultPage.close();
	await browser.close();
	cache.del(BROWSER_KEY);
	cache.del(DEFAULT_PAGE_KEY);
};
