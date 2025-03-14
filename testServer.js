import express from 'express';
import puppeteer from 'puppeteer';
import 'dotenv/config';
import AsyncLock from 'async-lock';

const app = express();
const PORT = process.env.PORT || 3000;
const lock = new AsyncLock();

// Global state
let browser;
let postLoginUrl;
let isAuthenticated = false;

async function login(page) {
    await page.goto(process.env.URL, { waitUntil: 'networkidle0' });
    
    // Check if already logged in
    if (page.url().includes('home')) {
        return true;
    }

    await page.type('input[name="username"]', process.env.LOGIN_USERNAME);
    await page.type('input[name="password"]', process.env.PASSWORD);
    await page.click('div.d-grid button:nth-of-type(2)');
    await page.waitForNavigation();
    
    // Handle login success/failure
    if (page.url().includes('login')) {
        throw new Error('Login failed');
    }
    
    postLoginUrl = page.url();
    isAuthenticated = true;
    
    // Handle initial popup
    try {
        await page.waitForSelector('div.fade.modal.show', { timeout: 2000 });
        await page.click('button.btn-close');
    } catch (error) {
        console.log('No initial popup');
    }
    
    return true;
}

async function ensureAuth(page) {
    if (!isAuthenticated) {
        await login(page);
        return;
    }

    // Check session validity
    await page.goto(postLoginUrl);
    if (page.url().includes('login')) {
        console.log('Session expired, re-authenticating...');
        isAuthenticated = false;
        await login(page);
    }
}

async function withPage(fn) {
    return lock.acquire('browser', async () => {
        const page = await browser.newPage();
        try {
            await ensureAuth(page);
            return await fn(page);
        } finally {
            await page.close();
        }
    });
}

// Initialize browser
async function initializeBrowser() {
    const browserInstance = await puppeteer.launch({ 
        headless: true, 
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Initial login
    const page = await browserInstance.newPage();
    await login(page);
    await page.close();
    
    return browserInstance;
}

// Endpoints
app.get('/series', async (req, res) => {
    try {
        const series = await withPage(async (page) => {
            return page.evaluate(() => {
                return Array.from(
                    document.querySelectorAll('div.accordion:nth-of-type(3) ul.navbar-nav:nth-of-type(2) > li > a')
                ).map(anchor => {
                    const menu = anchor.nextElementSibling;
                    return {
                        series: menu.querySelector('li > a')?.textContent?.trim() || 'Unknown',
                        matches: Array.from(menu.querySelectorAll('ul > li')).map(li => ({
                            matchName: li.querySelector('a')?.textContent?.trim() || 'Unnamed Match',
                            matchUrl: li.querySelector('a')?.href || '#'
                        }))
                    };
                });
            });
        });
        
        res.json(series);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/matches/:seriesName', async (req, res) => {
    try {
        const matches = await withPage(async (page) => {
            return page.evaluate((seriesName) => {
                const anchors = Array.from(document.querySelectorAll('div.accordion:nth-of-type(3) ul.navbar-nav:nth-of-type(2) > li > a'));
                
                for (const anchor of anchors) {
                    const menu = anchor.nextElementSibling;
                    const currentSeries = menu.querySelector('li > a')?.textContent?.trim();
                    if (currentSeries === seriesName) {
                        return Array.from(menu.querySelectorAll('ul > li')).map(li => ({
                            matchName: li.querySelector('a')?.textContent?.trim() || 'Unnamed Match',
                            matchUrl: li.querySelector('a')?.href || '#'
                        }));
                    }
                }
                return [];
            }, req.params.seriesName);
        });
        
        res.json(matches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Server initialization
initializeBrowser().then(browserInstance => {
    browser = browserInstance;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Failed to initialize browser:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await browser.close();
    process.exit();
});