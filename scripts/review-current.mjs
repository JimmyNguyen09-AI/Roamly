import { chromium } from "playwright-core";
import path from "node:path";

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
page.on("pageerror", (error) => errors.push(error.message));
await page.goto(process.env.ROAMLY_URL ?? "http://127.0.0.1:3000", { waitUntil: "networkidle" });
await page.waitForTimeout(500);

async function capture(id, progress, name) {
  await page.evaluate(({ id, progress }) => {
    const section = document.querySelector(id);
    if (!(section instanceof HTMLElement)) throw new Error(`Missing section ${id}`);
    const available = document.documentElement.scrollHeight - innerHeight - section.offsetTop;
    const travel = Math.max(1, Math.min(section.offsetHeight * 0.65, Math.max(1, available)));
    scrollTo({ top: section.offsetTop + travel * progress, behavior: "instant" });
  }, { id, progress });
  await page.waitForTimeout(1400);
  const phase = await page.locator(".three-canvas-container").evaluate((node) => getComputedStyle(node).getPropertyValue("--scene-phase"));
  await page.screenshot({ path: path.join("artifacts", "screenshots", `${name}.png`) });
  process.stdout.write(`${name}: phase ${phase}\n`);
}

await capture("#chapter-1", 0.52, "review-torii-approach");
await capture("#chapter-2", 0.45, "review-torii-threshold");
await capture("#chapter-2", 0.67, "review-torii-crossed");
await capture("#chapter-4", 0.24, "review-pack-clean");
await capture("#chapter-4", 0.58, "review-pack-hold");
await capture("#chapter-5", 0.2, "review-memory-enter");
await capture("#chapter-5", 0.62, "review-memory-hold");
await capture("#chapter-5", 0.88, "review-memory-late");

if (errors.length) throw new Error(errors.join(" | "));
await browser.close();
