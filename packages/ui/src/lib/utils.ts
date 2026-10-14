import type { CnFunction } from 'cn';
import { createCn } from 'cn/config';

// cn (замена clsx + tailwind-merge от shadcn) не знает размеры шрифта бренда из @mednet/tokens:
// без расширения cn('text-foreground', 'text-h3') считает text-h3 цветом и выбрасывает text-foreground.
// Тип указан явно: без него tsc падает с TS2883 (тип cn нельзя назвать без ссылки на CnFunction).
export const cn: CnFunction = createCn({
  extend: { classGroups: { 'font-size': [{ text: ['lead', 'h1', 'h2', 'h3', 'h4'] }] } },
});
