import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { serve } from "./server.mjs";
const localChrome =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
  (existsSync(localChrome) ? localChrome : undefined);
const server = process.env.SITE_URL ? null : await serve();
const base =
  process.env.SITE_URL || `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, executablePath });
const errors = [];
try {
  await mkdir("test-results", { recursive: true });
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const expected = ["top", "bottom", "left", "right", "top", "bottom", "left"];
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    await page.goto(base);
    await page.waitForSelector(".apps-enhanced");
    await page.evaluate(async () => {
      for (const img of document.images) img.loading = "eager";
      await Promise.all(
        [...document.images].map((i) => i.decode().catch(() => {})),
      );
    });
    for (
      let y = 0;
      y < (await page.evaluate(() => document.documentElement.scrollHeight));
      y += 650
    ) {
      await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y);
      await page.waitForTimeout(90);
    }
    await page.waitForTimeout(1500);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `Overflow ${width}`,
    );
    assert.equal(
      await page.locator(".reveal-pending,.media-pending").count(),
      0,
      "All entrances finish",
    );
    assert.deepEqual(
      await page
        .locator("[data-media-direction]")
        .evaluateAll((es) => es.map((e) => e.dataset.mediaDirection)),
      expected,
    );
    assert.deepEqual(
      await page
        .locator("img")
        .evaluateAll((es) =>
          es.filter((e) => !e.complete || !e.naturalWidth).map((e) => e.src),
        ),
      [],
      "All icons and images load",
    );
    for (let i = 0; i < 4; i++) {
      await page.locator(".app-selector").nth(i).click();
      assert.equal(await page.locator(".app-card:visible").count(), 1);
      assert.equal(
        await page.locator(".app-selector").nth(i).getAttribute("aria-pressed"),
        "true",
      );
      assert.match(
        await page.locator(`#app-panel-${i} a`).getAttribute("href"),
        /^https:\/\/apps.apple.com\/jp\/app\/id\d+$/,
      );
    }
    await page.locator(".app-selector").first().focus();
    await page.keyboard.press("End");
    assert.equal(
      await page.locator(".app-selector").last().getAttribute("aria-pressed"),
      "true",
    );
    await page.locator(".app-selector").first().click();
    if (width < 700) {
      await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
      await page.locator(".menu-toggle").click();
      assert.equal(
        await page.locator(".menu-toggle").getAttribute("aria-expanded"),
        "true",
      );
      await page.keyboard.press("Escape");
      assert.equal(
        await page.locator(".menu-toggle").getAttribute("aria-expanded"),
        "false",
      );
    }
    await page.locator(".community-details summary").first().click();
    assert.equal(
      await page.locator(".community-details").first().getAttribute("open"),
      "",
    );
    await page.locator(".community-details summary").first().click();
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.locator(".motion-toggle").click();
    assert.equal(
      await page.locator(".motion-toggle").getAttribute("aria-pressed"),
      "true",
    );
    if (width === 1440 || width === 390)
      await page.screenshot({
        path: `test-results/home-${width}.png`,
        fullPage: true,
      });
    console.log(
      `PASS ${width}px: images, entrances, app selection, keyboard, disclosure, menu, pause`,
    );
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await page.waitForSelector(".apps-enhanced");
  assert.equal(
    await page.locator(".motion-toggle").getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(await page.locator(".reveal-pending,.media-pending").count(), 0);
  const nojs = await browser.newPage({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 900 },
  });
  await nojs.goto(base);
  assert.equal(await nojs.locator(".app-card:visible").count(), 4);
  assert.equal(await nojs.locator("#site-menu a:visible").count(), 4);
  for (const route of ["/contact", "/chuin-privacy", "/orin-support"]) {
    const response = await page.goto(new URL(route, base).href);
    assert.equal(response.status(), 200, route);
    assert.equal(await page.locator("h1").count(), 1, route);
  }
  assert.deepEqual(errors, []);
  const html = await readFile("index.html", "utf8");
  assert(!/[\u{1F000}-\u{1FAFF}\u2600-\u27BF\uFE0F]/u.test(html), "No emoji");
  assert(
    !/永久無料|ローカルAI|Yoshibowが作成|Yoshihide Matsumoto|私自身|私が|私の/.test(
      html,
    ),
    "Copy corrections preserved",
  );
  console.log(
    "PASS reduced motion, no-JS fallback, support routes, copy and console checks",
  );
} finally {
  await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}
