import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // С пулом forks на Windows Vitest падает: «Timeout waiting for worker to respond».
    pool: 'threads',
    // Первый холодный прогон с eslint-config-next — около минуты.
    testTimeout: 60_000,
  },
});
