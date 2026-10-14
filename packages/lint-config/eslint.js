// @mednet/lint-config/eslint — flat config: только правила ядра ESLint, без парсера и плагинов.
// Парсер (typescript-eslint для .ts/.tsx) приходит из eslint-config-next; ставьте этот массив после него.
// Правила проекта с теми же именами ЗАМЕНЯЮТ наши (ESLint не сливает опции) — расширяйте
// через экспортируемые restrictedImports / restrictedSyntax.

// ---------- Импорты ----------

const UI_KIT =
  'Сторонние UI-библиотеки в проектах ЦНИИОИЗ не используются: компоненты берите из @mednet/ui (список — node_modules/@mednet/ui/llms.md).';
const PRIMITIVES =
  'Примитивы напрямую не импортируйте — только через @mednet/ui (например, @mednet/ui/dialog). Композиция — через проп render, не asChild.';
const ICONS = 'Иконки — только lucide-react.';

/** Опции правила no-restricted-imports; экспортируются, чтобы проект мог дополнить список. */
export const restrictedImports = {
  paths: [
    { name: 'antd', message: UI_KIT },
    { name: 'bootstrap', message: UI_KIT },
    { name: 'react-bootstrap', message: UI_KIT },
    { name: 'radix-ui', message: PRIMITIVES },
    // @base-ui/react не дублируем в paths: его ловит паттерн '@base-ui/*' (иначе два сообщения на строку)
    { name: 'react-icons', message: ICONS },
    { name: '@tabler/icons-react', message: ICONS },
  ],
  patterns: [
    {
      group: ['antd/*', 'bootstrap/*', 'react-bootstrap/*', '@mui/*', '@mantine/*', '@chakra-ui/*'],
      message: UI_KIT,
    },
    {
      group: ['radix-ui/*', '@radix-ui/*', '@base-ui/*', '@base-ui-components/*'],
      message: PRIMITIVES,
    },
    {
      group: [
        'react-icons/*',
        '@tabler/icons-react/*',
        '@heroicons/*',
        '@fortawesome/*',
        '@phosphor-icons/*',
        '@hugeicons/*',
      ],
      message: ICONS,
    },
  ],
};

// ---------- Литеральные цвета ----------
// Регулярки вставляются в селекторы esquery как /…/i. В них нельзя использовать «/»
// (esquery заканчивает регулярку на первом «/»), флаги — только i m s u.
// Hex: после него не буква/цифра/дефис, но «_» можно — Tailwind пишет пробелы как «_» (#fff_0%).
// Функции: буква, цифра или дефис перед именем — часть более длинного имени (color-mix(, --x-rgb),
// такое не ловим; «_» и пробел — разделители (shadow-[0_1px_2px_rgb(0_0_0/0.05)]), там ловим.

const HEX = String.raw`#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{3,4})(?![\da-z-])`;
const FN = String.raw`(?<![\da-z-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(`;
const COLOR = `${HEX}|${FN}`;

/** Строка или кусок шаблонной строки с литеральным цветом. */
const COLOR_STRING = `:matches(Literal[value=/${COLOR}/i], TemplateElement[value.raw=/${COLOR}/i])`;

const CLASS_ATTR = String.raw`JSXAttribute[name.name=/^(?:className|classNames)$|ClassName$/]`;
const CLASS_CALL = String.raw`CallExpression[callee.name=/^(?:cn|cva|clsx|cx|tv|twMerge|twJoin)$/]`;
const STYLE_ATTR = String.raw`JSXAttribute[name.name=/^style$|Style$/]`;

/** Записи правила no-restricted-syntax; экспортируются, чтобы проект мог дополнить список. */
export const restrictedSyntax = [
  {
    // Один селектор на оба контекста: className={cn('bg-[#fff]')} — одно сообщение, а не два.
    selector: `:matches(${CLASS_ATTR}, ${CLASS_CALL}) ${COLOR_STRING}`,
    message:
      'Цвет литералом в классах (#fff, rgb(…), oklch(…), bg-[#…], text-[rgb(…)]) запрещён: берите семантический класс — bg-primary, text-muted-foreground, border-border, bg-destructive, bg-field — или шкалу бренда (bg-red-500).',
  },
  {
    selector: `${STYLE_ATTR} ${COLOR_STRING}`,
    message:
      'Цвет литералом в style запрещён: используйте класс (bg-primary, text-muted-foreground, border-border) или переменную токена — var(--primary), var(--muted-foreground), var(--border).',
  },
];

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    name: '@mednet/lint-config/eslint',
    rules: {
      'no-restricted-imports': ['error', restrictedImports],
      'no-restricted-syntax': ['error', ...restrictedSyntax],
    },
  },
];

export default config;
