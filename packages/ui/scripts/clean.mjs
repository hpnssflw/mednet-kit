// Чистый dist перед tsc: tsc не удаляет файлы модулей, которых больше нет в src.
import { rmSync } from 'node:fs';

rmSync(new URL('../dist', import.meta.url), { recursive: true, force: true });
