import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const source = new URL('../src/', import.meta.url);
const target = new URL('../dist/', import.meta.url);
fs.mkdirSync(target, { recursive: true });
fs.cpSync(source, target, { recursive: true });
fs.chmodSync(fileURLToPath(new URL('cli.mjs', target)), 0o755);
