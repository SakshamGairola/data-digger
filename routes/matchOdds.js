import express from "express";
import attachBrowserSession from "../middleware/attachBrowserSession.js";

const router = express.Router();

router.post("/", attachBrowserSession, async (req, res) => {
  const { page } = req;
  const { url } = req.body;

  try {
    await page.goto(url, { waitUntil: "load" });
	await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for 2 seconds
    // const matchOdds = await page.evaluate(() => {
    // 	const marketData = {};
    // 	$('div.game-market').each(function () {
    // 		const $m = $(this);
    // 		const market = {};
    // 		const title = $m.find('.market-title span').first().text().trim();
    // 		const hdrText = $m.find('.market-header .market-nation-name').first().text().trim();

    // 		if (hdrText) {
    // 			const minMax = {};
    // 			hdrText.split(/\s{2,}| /).forEach((part) => {
    // 				const [k, v] = part.split(':').map((s) => s.trim());
    // 				if (k && v) minMax[k.toLowerCase()] = v;
    // 			});
    // 			market.limits = minMax;
    // 		}

    // 		market.rows = $m.find('.market-body .market-row').map(function () {
    // 			const $r = $(this);
    // 			const row = {
    // 				state: $r.data('title'),
    // 				name: $r.find('.market-nation-name').first().text().trim(),
    // 				odds: {},
    // 			};
    // 			$r.find('.market-odd-box').each(function () {
    // 				const classes = $(this).attr('class').split(/\s+/);
    // 				const key =
    // 					classes.find(c => /^back\d*$/.test(c) || /^lay\d*$/.test(c) || c === 'back' || c === 'lay') || 'other';
    // 				row.odds[key] = {
    // 					odd: $(this).find('.market-odd').text().trim() || null,
    // 					volume: $(this).find('.market-volume').text().trim() || null,
    // 				};
    // 			});
    // 			return row;
    // 		}).get();

    // 		marketData[title] = market;
    // 	});
    // 	return marketData;
    // });

    const matchOdds = await page.evaluate(() => {
      const marketData = {};

      document.querySelectorAll("div.game-market").forEach((marketEl) => {
        const market = {};

        const titleEl = marketEl.querySelector(".market-title span");
        const headerEl = marketEl.querySelector(
          ".market-header .market-nation-name"
        );

        const title = titleEl ? titleEl.textContent.trim() : "";
        const hdrText = headerEl ? headerEl.textContent.trim() : "";

        if (hdrText) {
          const minMax = {};
          hdrText.split(/\s{2,}| /).forEach((part) => {
            const [k, v] = part.split(":").map((s) => s.trim());
            if (k && v) minMax[k.toLowerCase()] = v;
          });
          market.limits = minMax;
        }

        const rows = [];
        marketEl
          .querySelectorAll(".market-body .market-row")
          .forEach((rowEl) => {
            const row = {
              state: rowEl.getAttribute("data-title"),
              name:
                rowEl
                  .querySelector(".market-nation-name")
                  ?.textContent.trim() || "",
              odds: {},
            };

            rowEl.querySelectorAll(".market-odd-box").forEach((oddBoxEl) => {
              const classes = oddBoxEl.className.split(/\s+/);
              const key =
                classes.find(
                  (c) =>
                    /^back\d*$/.test(c) ||
                    /^lay\d*$/.test(c) ||
                    c === "back" ||
                    c === "lay"
                ) || "other";

              row.odds[key] = {
                odd:
                  oddBoxEl.querySelector(".market-odd")?.textContent.trim() ||
                  null,
                volume:
                  oddBoxEl
                    .querySelector(".market-volume")
                    ?.textContent.trim() || null,
              };
            });

            rows.push(row);
          });

        market.rows = rows;
        marketData[title] = market;
      });

      return marketData;
    });

    // await browser.close();
    res.status(200).json(matchOdds);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong during scraping." });
  }
});

export default router;
