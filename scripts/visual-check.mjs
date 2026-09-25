import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseURL = process.env.ROAMLY_URL ?? "http://127.0.0.1:3000";
const executablePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = path.resolve("artifacts", "screenshots");
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });
const results = [];

async function inspectRoute(route, name, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(`${baseURL}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(750);
  const metrics = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    title: document.title,
  }));
  if (!response?.ok()) throw new Error(`${route} returned ${response?.status()}`);
  if (metrics.scrollWidth > metrics.viewport + 1) throw new Error(`${route} overflows: ${metrics.scrollWidth}px > ${metrics.viewport}px`);
  if (errors.length) throw new Error(`${route} console errors: ${errors.join(" | ")}`);
  await page.screenshot({ path: path.join(outputDir, `${name}-${viewport.width}x${viewport.height}.png`) });
  results.push(`${name} ${viewport.width}x${viewport.height}: ok`);
  await context.close();
}

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
  await inspectRoute("/", "home", viewport);
}
for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
  await inspectRoute("/planner?destination=Japan", "planner", viewport);
  await inspectRoute("/share", "share", viewport);
}

const interactionContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const planner = await interactionContext.newPage();
await planner.goto(`${baseURL}/planner?destination=Japan`, { waitUntil: "networkidle" });
await planner.getByRole("tab", { name: /Day 4/i }).focus();
await planner.keyboard.press("ArrowRight");
if (!(await planner.getByRole("tab", { name: /Day 5/i }).getAttribute("aria-selected") === "true")) throw new Error("Planner arrow-key day navigation failed");
await planner.getByRole("button", { name: "Add a place" }).click();
await planner.getByLabel("Place name").fill("Kyoto Design Museum");
await planner.getByLabel("Location").fill("Kyoto");
await planner.getByRole("button", { name: "Save place" }).click();
await planner.getByText("Kyoto Design Museum").waitFor();
await planner.getByRole("button", { name: "Schedule", exact: true }).last().click();
await planner.getByRole("heading", { name: "Kyoto Design Museum" }).waitFor();
results.push("planner keyboard and local-state interactions: ok");

const share = await interactionContext.newPage();
await share.goto(`${baseURL}/share`, { waitUntil: "networkidle" });
await share.getByRole("button", { name: "Mock download for offline" }).click();
await share.getByText("Demo action only").waitFor();
results.push("share demo action: ok");
await interactionContext.close();

const reducedContext = await browser.newContext({ viewport: { width: 768, height: 1024 }, reducedMotion: "reduce" });
const reducedPage = await reducedContext.newPage();
await reducedPage.goto(`${baseURL}/`, { waitUntil: "networkidle" });
await reducedPage.waitForTimeout(250);
if (await reducedPage.locator(".three-canvas-container").count()) throw new Error("Reduced-motion mode loaded WebGL canvas");
const hiddenWord = await reducedPage.locator(".word-reveal-span").first().evaluate((element) => getComputedStyle(element).opacity);
if (hiddenWord !== "1") throw new Error("Reduced-motion heading is not in its final state");
results.push("reduced-motion fallback: ok");
await reducedContext.close();

const fallbackContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await fallbackContext.addInitScript(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
    return original.call(this, type, ...args);
  };
});
const fallbackPage = await fallbackContext.newPage();
await fallbackPage.goto(`${baseURL}/`, { waitUntil: "networkidle" });
await fallbackPage.waitForTimeout(300);
if (await fallbackPage.locator(".three-canvas-container").count()) throw new Error("No-WebGL mode loaded the story canvas");
if (!(await fallbackPage.getByAltText("Traveller overlooking Kyoto at dawn").isVisible())) throw new Error("No-WebGL hero poster is missing");
results.push("no-WebGL poster fallback: ok");
await fallbackContext.close();

const canvasContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const canvasPage = await canvasContext.newPage();
await canvasPage.goto(`${baseURL}/`, { waitUntil: "networkidle" });
await canvasPage.waitForTimeout(500);
const canvas = canvasPage.locator(".three-canvas-container");
if (await canvas.count()) {
  await canvasPage.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await canvasPage.waitForTimeout(100);
  if (await canvas.getAttribute("data-rendering") !== "paused") throw new Error("Canvas loop did not pause when document became hidden");
  results.push("canvas visibility pause: ok");

  await canvasPage.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  for (const chapter of ["chapter-4", "chapter-5", "chapter-6", "chapter-7"]) {
    await canvasPage.locator(`#${chapter}`).scrollIntoViewIfNeeded();
    await canvasPage.waitForTimeout(700);
    await canvasPage.screenshot({ path: path.join(outputDir, `home-${chapter}-1440x900.png`) });
  }
  await canvasPage.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await canvasPage.waitForTimeout(3000);
  if (await canvas.getAttribute("data-rendering") !== "paused") throw new Error("Canvas loop did not settle in the final chapter");
  results.push("canvas final-chapter settle: ok");
} else {
  results.push("canvas visibility pause: skipped by browser performance policy");
}
await canvasContext.close();

await browser.close();
console.log(results.join("\n"));
