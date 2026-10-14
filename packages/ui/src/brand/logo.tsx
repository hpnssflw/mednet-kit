import type { SVGProps } from 'react';
import { LogoHorizontal } from './logo/logo-horizontal.js';
import { LogoMark } from './logo/logo-mark.js';
import { LogoVertical } from './logo/logo-vertical.js';

const VARIANTS = { horizontal: LogoHorizontal, vertical: LogoVertical, mark: LogoMark } as const;

export interface LogoProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  /** horizontal — знак, «ЦНИИОИЗ» и дескриптор; vertical — знак и «ЦНИИОИЗ»; mark — только знак. */
  variant?: keyof typeof VARIANTS;
  /** Доступное имя («ЦНИИОИЗ»). Не нужно, если логотип внутри ссылки с aria-label. */
  title?: string;
}

/** Логотип ЦНИИОИЗ. Размер — классом высоты: `className="h-10 w-auto"`. */
export function Logo({ variant = 'horizontal', ...props }: LogoProps) {
  const Variant = VARIANTS[variant];
  return <Variant {...props} />;
}

// Отдельные варианты: в клиентском компоненте импорт одного варианта не тянет остальные.
export { LogoHorizontal, LogoMark, LogoVertical };
