import { launch } from 'puppeteer';
import express from 'express';
const app = express();

let latestData = {};

// Function to scrape data using Puppeteer
async function scrapeData() {
    const browser = await launch({ headless: true });
    const page = await browser.newPage();

    // Log in to the website
    await page.goto('https://example.com/login');
    await page.type('#username', 'your_username');
    await page.type('#password', 'your_password');
    await page.click('#loginButton');
    await page.waitForNavigation();

    // Connect to WebSocket and listen for updates
    await page.evaluate(() => {
        const ws = new WebSocket('wss://example.com/data');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            window.latestData = data; // Store the data
        };
    });

    // Continuously update latestData
    setInterval(async () => {
        latestData = await page.evaluate(() => window.latestData);
    }, 1000);

    // Keep the browser open
    // await browser.close(); // Uncomment if you want to close the browser
}

// API endpoint to serve the latest data as JSON
app.get('/data', (req, res) => {
    res.json(latestData);
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    await scrapeData();
});
