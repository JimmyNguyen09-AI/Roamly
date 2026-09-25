import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseURL = process.env.ROAMLY_URL ?? "http://127.0.0.1:3000";
const executablePath = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = path.resolve(".img2threejs", "renders");
await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
for (const model of ["suitcase", "torii"]) {
  for (const view of ["front", "right", "rear", "left", "threequarter"]) {
    const page = await browser.newPage({ viewport: { width: 900, height: 900 }, deviceScaleFactor: 1 });
    await page.goto(`${baseURL}/model-lab?model=${model}&view=${view}`, { waitUntil: "networkidle" });
    await page.locator('[data-ready="true"]').waitFor();
    await page.screenshot({ path: path.join(outputDir, `${model}-${view}.png`) });
    await page.close();
  }
}
for (const [model, viewport] of [["suitcase", { width: 1024, height: 1536 }], ["torii", { width: 1536, height: 1024 }]]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.goto(`${baseURL}/model-lab?model=${model}&view=reference&clean=1`, { waitUntil: "networkidle" });
  await page.locator('[data-ready="true"]').waitFor();
  await page.screenshot({ path: path.join(outputDir, `${model}-reference.png`), omitBackground: true });
  await page.close();
}
await browser.close();
console.log(`Captured model review views in ${outputDir}`);
