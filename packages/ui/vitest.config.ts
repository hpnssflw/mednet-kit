import { defineConfig } from 'vitest/config';

export default defineConfig({
  // '#components/*' и др. → исходники src/ без сборки (условие из "imports" в package.json).
  resolve: { conditions: ['mednet-source'] },
  test: {
    environment: 'jsdom',
    // С пулом forks на Windows Vitest падает: «Timeout waiting for worker to respond».
    pool: 'threads',
    setupFiles: ['./src/__tests__/setup.ts'],
    // Тест генератора логотипа тяжёлый: под нагрузкой (CI, параллельная сборка) он не влезает в 5 с.
    testTimeout: 30_000,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
