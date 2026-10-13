/**
 * Оттенки брендбука ЦНИИОИЗ v8, от тёмного к светлому (s1…s6).
 * Взяты из векторных заливок PDF (стр. 12–13). Подписанные в брендбуке HEX —
 * ошибка копипаста (везде #d68780), их не использовать.
 */
export const BRAND_SHADES = {
  red: ['#a55551', '#b55c57', '#d6867f', '#e0a5a0', '#ebc3c0', '#f5e1df'],
  blue: ['#324d5b', '#4a7388', '#6399b5', '#8ab3c8', '#b1ccda', '#d8e6ed'],
  green: ['#58754a', '#63914a', '#98c185', '#b2d1a4', '#cce0c2', '#e5f0e1'],
  yellow: ['#bba174', '#dbc194', '#f9d79b', '#fbe1b4', '#fcebcd', '#fef5e6'],
  orange: ['#aa744b', '#ca946b', '#e29a64', '#e9b38b', '#f1cdb2', '#f8e6d8'],
  violet: ['#83708e', '#9980aa', '#ae95bd', '#c2b0ce', '#d7cade', '#ebe5ef'],
  beige: ['#a6998a', '#c6b9aa', '#ddccb8', '#e6d9ca', '#eee6dc', '#f7f2ed'],
  peach: ['#b68e7a', '#d6ae9a', '#f3bda3', '#f6ceba', '#f9ded1', '#fcefe8'],
} as const;

export type BrandHue = keyof typeof BRAND_SHADES;
export type ShadeRow = readonly [string, string, string, string, string, string];

/**
 * Нейтральная шкала. 900 (графит из брендбука), 600 и 400 зафиксированы спекой §5,
 * остальные шаги — обычные нейтральные серые.
 */
export const GRAPHITE = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#8a8a8a',
  500: '#737373',
  600: '#666666',
  700: '#525252',
  800: '#404040',
  900: '#333333',
  950: '#1f1f1f',
} as const;

/** Красный для ошибок — намеренно вне палитры бренда, чтобы не путаться с primary. */
export const DANGER = {
  100: '#fdecea',
  600: '#c62828',
} as const;
