import { expect, test } from '@playwright/test';

test('диалог открывается и закрывается с клавиатуры', async ({ page }) => {
  await page.goto('/ui/');
  await page.getByRole('button', { name: 'Открыть диалог' }).click();
  const dialog = page.getByRole('dialog', { name: 'Заявка на обучение' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('уведомление появляется', async ({ page }) => {
  await page.goto('/ui/');
  await page.getByRole('button', { name: 'Показать уведомление' }).click();
  await expect(page.getByText('Заявка отправлена')).toBeVisible();
});

test('бренд: поля белые, наведение на основную кнопку — --primary-hover', async ({ page }) => {
  await page.goto('/ui/');
  await expect(page.getByLabel('ФИО')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await expect(page.getByRole('button', { name: 'Контурная' })).toHaveCSS(
    'background-color',
    'rgb(255, 255, 255)',
  );
  const primary = page.getByRole('button', { name: 'Отправить заявку' });
  await primary.hover();
  await expect(primary).toHaveCSS('background-color', 'rgb(165, 85, 81)');
});

test('шрифт Montserrat загружен', async ({ page }) => {
  await page.goto('/ui/');
  expect(await page.evaluate(() => document.fonts.check('500 16px Montserrat'))).toBe(true);
});

test('AppShell: кнопка меню сворачивает боковую панель', async ({ page }) => {
  await page.goto('/ui/app-shell/');
  const sidebar = page.locator('[data-slot="sidebar"][data-state]');
  await expect(sidebar).toHaveAttribute('data-state', 'expanded');
  await page.locator('[data-slot="sidebar-trigger"]').click();
  await expect(sidebar).toHaveAttribute('data-state', 'collapsed');
});
