import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ESLint, type Linter } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';
import mednetEslint, { restrictedImports } from '../eslint.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

/** Номера строк с маркером — там обязано быть ровно одно сообщение. */
const badLines = (name: string, marker: string) =>
  readFileSync(fixture(name), 'utf8')
    .split('\n')
    .flatMap((line, index) => (line.includes(marker) ? [index + 1] : []));

async function lintTsx(base: Linter.Config[]) {
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: [...base, ...mednetEslint],
  });
  const [bad, good] = await eslint.lintFiles([fixture('bad.tsx'), fixture('good.tsx')]);
  return { bad: bad!, good: good! };
}

const standalone: Linter.Config[] = [
  { files: ['**/*.{ts,tsx}'], languageOptions: { parser: tseslint.parser } },
];

async function withNext(): Promise<Linter.Config[]> {
  const nextVitals = (await import('eslint-config-next/core-web-vitals')).default;
  const nextTs = (await import('eslint-config-next/typescript')).default;
  return [...nextVitals, ...nextTs];
}

describe.each([
  ['только парсер typescript-eslint', async () => standalone],
  ['вместе с eslint-config-next', withNext],
])('eslint: %s', (_name, base) => {
  it('ловит каждую плохую строку ровно один раз и молчит на хорошем файле', async () => {
    const { bad, good } = await lintTsx(await base());
    const expected = badLines('bad.tsx', '// @bad');
    expect(expected.length).toBeGreaterThan(60);
    expect(bad.messages.filter((message) => message.fatal)).toEqual([]);
    expect(bad.messages.map((message) => message.line)).toEqual(expected);
    expect(new Set(bad.messages.map((message) => message.ruleId))).toEqual(
      new Set(['no-restricted-imports', 'no-restricted-syntax']),
    );
    expect(good.messages).toEqual([]);
  });
});

describe('расширение в проекте', () => {
  it('свой список запретов проекта дополняет наш, а не заменяет', async () => {
    const eslint = new ESLint({
      cwd: root,
      overrideConfigFile: true,
      overrideConfig: [
        ...standalone,
        ...mednetEslint,
        {
          rules: {
            'no-restricted-imports': [
              'error',
              {
                ...restrictedImports,
                paths: [...restrictedImports.paths, { name: 'lodash', message: 'lodash-es' }],
              },
            ],
          },
        },
      ],
    });
    const [result] = await eslint.lintText('import "antd";\nimport "lodash";\n', {
      filePath: fixture('extend.ts'),
    });
    expect(result!.messages.map((message) => message.line)).toEqual([1, 2]);
  });
});
