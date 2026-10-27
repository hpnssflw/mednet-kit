---
'@mednet/ui': patch
---

В пакет добавлен `stack.json` (`@mednet/ui/stack.json`) — карта того, на чём построен кит: shadcn/ui, Base UI, Tailwind, lucide-react, Recharts, Embla Carousel, react-day-picker и другие, с ролью, ссылками на документацию, `llms.txt` и подсказкой, когда куда смотреть. В `llms.md` появился раздел «Стек и где искать API». Вид компонентов и API не менялись.

Уровень `patch` выбран владельцем как исключение из правила «новый экспорт — minor» (docs/releasing.md): внешний вид и API компонентов не меняются, добавлен только справочный файл.
