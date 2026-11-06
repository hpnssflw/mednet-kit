import { readFileSync } from 'node:fs';
export function supportsLoader(loaderVersion) {
  const installed = loaderVersion.split('.').map(Number),
    current = version.split('.').map(Number);
  if (installed[0] !== current[0]) return false;
  for (let index = 0; index < 3; index++) {
    if (installed[index] > current[index]) return false;
    if (installed[index] < current[index]) return true;
  }
  return true;
}
export const version = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
).version;
