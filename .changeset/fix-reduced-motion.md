---
"@mednet/ui": patch
"@mednet/css": patch
"@mednet/tokens": patch
"@mednet/lint-config": patch
"@mednet/cli": patch
---

React соблюдает prefers-reduced-motion для Spinner, Skeleton и других CSS-анимаций, как HTML-поверхность. Одна короткая итерация сохраняет animationend, видимость и доступный статус загрузки. Уточнены справки потребителей и команды первого публичного CLI.
