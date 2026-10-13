import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Эталоны снимаются только в Linux-образе Playwright — суффикс платформы не нужен.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:4173',
  },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.001 },
  },
  webServer: {
    command: 'node scripts/serve-out.mjs',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
  },
});
