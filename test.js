import puppeteer from 'puppeteer';
import 'dotenv/config';


async function main () {
    const URL = process.env.URL;

    const creds = {
        username: process.env.LOGIN_USERNAME,
        password: process.env.PASSWORD
    };

    const browser = await puppeteer.launch({headless: false, defaultViewport: null});
    const page = await browser.newPage();

    // goto URL
    await page.goto(URL, { waitUntil: "networkidle0" });

    // enter creds here
    await page.type('input[name="username"]', creds.username);
    await page.type('input[name="password"]', creds.password);

    // login and wait to load
    await page.click('div.d-grid button:nth-of-type(2)');
    await page.waitForNavigation();

    // check if there is a pop up banner and close it
    try {
        await page.waitForSelector('div.fade.modal.show');
        await page.click('button.btn-close');
    } catch (error) {
        console.log('No pop up banner'); 
    }

    // get categories of cricket: input: none; output: json object with match categories with match name and url
    // const series = await page.evaluate(() => {
    //     // Transform dropdown menus into an array of categories
    //     return Array.from(
    //         $('div.accordion:nth-of-type(3) ul.navbar-nav:nth-of-type(2)>li>a')
    //             .siblings('ul.dropdown-menu') // Select sibling dropdown menus
    //     ).map(menuElement => {
    //         const $menu = $(menuElement); // Cache jQuery object
    //         const seriesName = $menu.find('li>a:first')?.[0]?.textContent?.trim() || 'Unknown Category';
    
    //         // Extract matches from the current menu
    //         const matches = $menu.find('ul').children().map((_, matchElement) => {
    //             const $match = $(matchElement); // Cache jQuery object
    //             const matchName = $match.find('a')?.[0]?.textContent?.trim() || 'Unnamed Match';
    //             const matchUrl = $match.find('a')?.[0]?.href || '#';
    
    //             return { matchName, matchUrl };
    //         }).get(); // Get plain array from jQuery map
    
    //         return {
    //             series: seriesName,
    //             matches: matches
    //         };
    //     });
    // });

    // get name and url of games: input: category; output json object with name and url
    // const matches = await page.evaluate(() => {
    //     // Transform dropdown menus into an array of categories
    //     const requestedSeries = 'West Indies Championship 2025';
    //     let matchedElement = $('div.accordion:nth-of-type(3) ul.navbar-nav:nth-of-type(2)>li>a').siblings('ul.dropdown-menu')
    //                         .filter((_, element) => $(element).find('li>a:first')?.[0]?.textContent?.trim() === requestedSeries)[0] || null;

    //     const requestedMatches = [];
    //     if(matchedElement) {
    //         $(matchedElement).find('ul').children().each((_, matchElement) => {
    //             const $match = $(matchElement); // Cache jQuery object
    //             const matchName = $match.find('a')?.[0]?.textContent?.trim() || 'Unnamed Match';
    //             const matchUrl = $match.find('a')?.[0]?.href || '#';
    //             requestedMatches.push({ matchName, matchUrl });
    //         }).get();
    //     }
    //     return requestedMatches;
    // });

    // get a game's odds: input: url for that game; output: odds in json object
    const url = 'https://allpanelexch.com/virtual-cricket/4/689944178';
    await page.goto(url, { waitUntil: "networkidle0" });


    // api for tv 

}

main();