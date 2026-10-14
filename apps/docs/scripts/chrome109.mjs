// Smoke-тест в Chromium 109 — последнем Chrome для Windows 7/8.1 (спека D18, §14).
// Запуск: node scripts/chrome109-docker.mjs (Docker-образ Playwright 1.29.2 на собранном out/).
import { chromium } from 'playwright-core';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173';
const failures = [];

function check(name, ok, details) {
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ` — ${details}`}`);
  if (!ok) failures.push(name);
}

/** Альфа цвета из getComputedStyle: rgb(…) → 1, rgba(…, a) → a. */
function alpha(color) {
  const match = color.match(/rgba\([^)]*,\s*([\d.]+)\)/);
  return match ? Number(match[1]) : 1;
}

const browser = await chromium.launch();
check(
  `Chromium ${browser.version()}`,
  browser.version().startsWith('109.'),
  'ожидался Chromium 109',
);

async function open(path) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  return { page, errors };
}

async function focusShadow(page, testId) {
  await page.mouse.click(2, 2);
  for (let i = 0; i < 80; i += 1) {
    await page.keyboard.press('Tab');
    const shadow = await page.evaluate((id) => {
      const element = document.querySelector(`[data-testid="${id}"]`);
      return element === document.activeElement ? getComputedStyle(element).boxShadow : null;
    }, testId);
    if (shadow !== null) return shadow;
  }
  return 'элемент не получил фокус';
}

for (const [side, path] of [
  ['React', '/parity/'],
  ['статика', '/parity/static.html'],
]) {
  const { page, errors } = await open(path);
  const style = (id, property) =>
    page.$eval(`[data-testid="${id}"]`, (element, p) => getComputedStyle(element)[p], property);
  const ring = await focusShadow(page, 'btn-outline');
  check(`${side}: кольцо фокуса у контурной кнопки`, /rgba?\(/.test(ring), ring);
  const destructive = await style('btn-destructive', 'backgroundColor');
  check(`${side}: деструктивная кнопка полупрозрачная`, alpha(destructive) < 0.5, destructive);
  const input = await style('input', 'backgroundColor');
  check(`${side}: поле ввода белое`, input === 'rgb(255, 255, 255)', input);
  check(`${side}: без ошибок JS`, errors.length === 0, errors.join('; '));
  await page.close();
}

{
  const { page } = await open('/parity/dialog/');
  const overlay = await page.$eval(
    '[data-slot="dialog-overlay"]',
    (element) => getComputedStyle(element).backgroundColor,
  );
  check(
    'React: фон под диалогом затемнён, а не залит чёрным',
    alpha(overlay) > 0 && alpha(overlay) < 1,
    overlay,
  );
  await page.close();
}

{
  const { page } = await open('/parity/static-dialog.html');
  const backdrop = await page.$eval(
    'dialog',
    (element) => getComputedStyle(element, '::backdrop').backgroundColor,
  );
  check('статика: фон под диалогом затемнён', alpha(backdrop) > 0, backdrop);
  await page.close();
}

{
  const { page, errors } = await open('/ui/app-shell/');
  await page.click('[data-slot="sidebar-trigger"]');
  await page.waitForTimeout(500);
  const state = await page.getAttribute('[data-slot="sidebar"][data-state]', 'data-state');
  check('React: AppShell сворачивается (страница ожила)', state === 'collapsed', state);
  check('React AppShell: без ошибок JS', errors.length === 0, errors.join('; '));
  await page.close();
}

await browser.close();
if (failures.length > 0) {
  console.error(`Chromium 109: не прошло проверок — ${failures.length}`);
  process.exit(1);
}
console.log('Chromium 109: все проверки прошли');
