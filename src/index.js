import express from "express";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import cors from "cors";

const app = express();
const port = 3000;
puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? "https://devhunt.org" : "*",
  })
);

app.get("/", async (req, res) => {
  const { url } = req.query;
  console.log(url);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--lang=en-US,en;q=0.9",
        "--window-size=1366,768",
      ],
      defaultViewport: { width: 1366, height: 768 },
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "platform", { get: () => "MacIntel" });
    });

    // Navigate the page to a URL and wait for the network to be mostly idle
    const response = await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Optional: small human-like pause
    await delay(1500);

    const finalUrl = (response && response.url()) || page.url();
    console.log("Final URL:", finalUrl);

    res.send(finalUrl.replace("/?ref=producthunt", ""));
  } catch (error) {
    console.error("Puppeteer failed:", error);
    res.status(500).send({ message: "Failed to fetch page", error });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
