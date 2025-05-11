import puppeteer from 'puppeteer';
import { getBrowserConfig } from '../config/browserConfig.js';

const initBrowserSession = async (req, res, next) => {
	const URL = process.env.URL;
	const creds = {
		username: process.env.LOGIN_USERNAME,
		password: process.env.PASSWORD,
	};

	try {
		const browser = await puppeteer.launch(getBrowserConfig());
		const page = await browser.newPage();

		await page.goto(URL, { waitUntil: 'networkidle0' });
		await page.type('input[name="username"]', creds.username);
		await page.type('input[name="password"]', creds.password);
		await page.click('div.d-grid button:first-of-type');
		await page.waitForNavigation();

		try {
			await page.waitForSelector('div.fade.modal.show button.btn-close', {
				timeout: 3000,
				visible: true,
			});
			await page.click('div.fade.modal.show button.btn-close');
			console.log('Modal closed');
		} catch {
			console.log('No modal found');
		}

		req.browser = browser;
		req.page = page;
		next();
	} catch (err) {
		console.error('Puppeteer setup failed:', err);
		res.status(500).json({ error: 'Browser setup failed' });
	}
};

export default initBrowserSession;
