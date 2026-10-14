// Сгенерировано scripts/gen-logos.mjs из assets/brand/logo/logo-mark.svg, не редактировать.
import { useId, type SVGProps } from "react";

export interface LogoMarkProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Доступное имя. Без него логотип декоративный (aria-hidden). */
  title?: string;
}

export function LogoMark({ title, ...props }: LogoMarkProps) {
  const uid = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="1 1 113.18 94.15"
      role={title ? "img" : undefined}
      aria-labelledby={title ? `${uid}title` : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title id={`${uid}title`}>{title}</title> : null}
      <path fill="#d6867f" d="M113.19 54.12c0 22.23-20.37 40.25-45.49 40.25-17.15 0-32.07-8.39-39.83-20.77h14.49a32.67 32.67 0 0 0 26.21 13.1c17.99 0 32.57-14.46 32.57-32.27S86.57 22.16 68.57 22.16c-1.87 0-3.74.16-5.58.48l11.91 5.4-3.57 7.85-23.3-10.59L58.61 2l7.35 3.34-4.02 8.86c1.91-.21 3.84-.31 5.76-.31 25.12 0 45.49 18.02 45.49 40.23"/><path fill="#d6867f" d="m44.45 26.74 7.02-15.45-7.35-3.33-10.59 23.3 23.31 10.58 3.56-7.85zm-3.79 18.64H27.85V32.57H14.81v12.81H2v13.03h12.81v12.82h13.04V58.41h12.81z"/>
    </svg>
  );
}
