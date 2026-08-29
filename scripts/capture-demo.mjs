import { chromium } from "playwright";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(__dirname, "../docs/sphere-graph-demo.png");
const url = process.env.DEMO_URL ?? "http://localhost:5175/";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
// Stop auto-spin so nodes are stable for interaction
await page.locator(".sphere-graph__svg").click({ position: { x: 80, y: 80 } });
await page.waitForTimeout(400);

const node = page.locator('[aria-label*="Meet the guide"]').first();
if (await node.count()) {
  await node.click({ force: true });
  await page.waitForTimeout(500);
}

await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log(`Wrote ${out}`);
