import { expect, test } from '@playwright/test';
import { PAGES } from './pages.ts';

for (const [name, path] of PAGES) {
  test(`внешний вид: ${name}`, async ({ page }) => {
    await page.goto(path);
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    // ResponsiveContainer рисует SVG только после гидратации и замера размера. Под нагрузкой
    // (параллельный parity-тест) это случается позже первого снимка проверки стабильности, и он
    // получается с пустым графиком (ui-previous.png). Ждём сами столбцы, а не тайминг.
    for (const chart of await page.locator('[data-slot="chart"]').all()) {
      await expect(chart.locator('.recharts-bar-rectangle').first()).toBeVisible();
    }
    await expect(page).toHaveScreenshot(`${name}.png`, {
      fullPage: true,
      // Демо внутри iframe снимается отдельной страницей static-demo.
      mask: [page.locator('iframe')],
    });
  });
}
