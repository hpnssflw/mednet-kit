import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildPrimitives } from '../src/primitives.ts';

const file = new URL('../tokens/primitives.json', import.meta.url);
writeFileSync(file, `${JSON.stringify(buildPrimitives(), null, 2)}\n`);
console.log(`Записано: ${fileURLToPath(file)}`);
