import puppeteer from 'puppeteer';
import { getBrowserConfig } from '../config/browserConfig.js';

let browser;
let page;

export const initBrowser = async () => {
    if (browser) return; // Already initialized

    const URL = process.env.URL;
    const creds = {
        username: process.env.LOGIN_USERNAME,
        password: process.env.PASSWORD,
    };

    browser = await puppeteer.launch(getBrowserConfig());
    page = await browser.newPage();

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

    console.log('Browser session initialized');
};

export const getBrowser = () => browser;
export const getPage = () => page;

export const closeBrowser = async () => {
    if (browser) {
        await browser.close();
        browser = null;
        page = null;
        console.log('Browser session closed');
    }
};
