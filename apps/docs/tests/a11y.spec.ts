import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PAGES } from './pages.ts';

for (const [name, path] of PAGES) {
  test(`доступность: ${name}`, async ({ page }) => {
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page }).analyze();
    const blocking = violations.filter(
      (violation) => violation.impact === 'serious' || violation.impact === 'critical',
    );
    expect(blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.length} эл.)`)).toEqual([]);
  });
}
