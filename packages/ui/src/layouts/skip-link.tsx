/** Ссылка «Перейти к содержанию»: первая по Tab, видна только в фокусе. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow-md"
    >
      Перейти к содержанию
    </a>
  );
}
