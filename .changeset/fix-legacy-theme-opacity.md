---
'@mednet/ui': patch
'@mednet/css': patch
'@mednet/tokens': patch
'@mednet/lint-config': patch
'@mednet/cli': patch
---

Сохранить связь полупрозрачных цветов Tailwind с токенами при переключении тёмной темы и палитр в Chrome/Edge 109. PostCSS fallback использует наследуемые RGB/alpha и сохраняет исходную прозрачность токена; современные color-mix правила не меняются.
