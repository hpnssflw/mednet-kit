import { expect, test } from '@playwright/test';
import { PAGES } from './pages.ts';

for (const [name, path] of PAGES) {
  test(`внешний вид: ${name}`, async ({ page }) => {
    await page.goto(path);
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      // Демо внутри iframe снимается отдельной страницей static-demo.
      mask: [page.locator('iframe')],
    });
  });
}
