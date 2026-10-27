// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — .mjs без типов
import { GROUPS, readStack, renderStackSection, versionOf } from '../../scripts/stack.mjs';

interface Entry {
  id: string;
  name: string;
  package: string | null;
  group: 'base' | 'lib' | 'kit';
  role: string;
  docs: string;
  llms?: string;
  when: string;
  usage: 'inside' | 'peer' | 'project';
  version: string | null;
}

const root = new URL('../../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));
const entries: Entry[] = readStack(root);

describe('stack.json', () => {
  it('в наборе есть все обязательные библиотеки', () => {
    const ids = entries.map((e) => e.id);
    for (const id of [
      'shadcn-ui',
      'base-ui',
      'tailwindcss',
      'lucide-react',
      'recharts',
      'embla-carousel-react',
      'react-day-picker',
      'cmdk',
      'input-otp',
      'react-resizable-panels',
      'mednet-tokens',
    ])
      expect(ids).toContain(id);
  });

  it('id уникальны', () => {
    const ids = entries.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(readStack(root).map((e: Entry) => [e.id, e] as const))(
    '%s: поля заполнены, ссылки — https',
    (_id, e) => {
      expect(Object.keys(GROUPS)).toContain(e.group);
      expect(['inside', 'peer', 'project']).toContain(e.usage);
      for (const key of ['name', 'role', 'when'] as const) expect(e[key].trim()).not.toBe('');
      expect(e.docs).toMatch(/^https:\/\//);
      if (e.llms) expect(e.llms).toMatch(/^https:\/\//);
    },
  );

  it('у каждого пакета из stack.json находится версия', () => {
    for (const e of entries) {
      if (e.package === null) continue;
      expect(versionOf(pkg, e.package), e.package).toBeTruthy();
    }
  });

  it('пакеты со способом inside и peer объявлены в package.json', () => {
    const declared = new Set([
      ...Object.keys(pkg.dependencies),
      ...Object.keys(pkg.peerDependencies),
      ...Object.keys(pkg.devDependencies),
    ]);
    for (const e of entries.filter((x) => x.usage !== 'project' && x.package))
      expect(declared.has(e.package as string), e.package as string).toBe(true);
  });

  it('stack.json опубликован и экспортирован', () => {
    expect(pkg.files).toContain('stack.json');
    expect(pkg.exports['./stack.json']).toBe('./stack.json');
    expect(existsSync(new URL('stack.json', root))).toBe(true);
  });
});

describe('renderStackSection', () => {
  const text: string = renderStackSection(entries);

  it('начинается с заголовка раздела и содержит все записи', () => {
    expect(text.startsWith('## Стек и где искать API')).toBe(true);
    for (const e of entries) expect(text).toContain(e.name);
  });

  it('разбит на группы и содержит правило поиска API', () => {
    for (const title of Object.values(GROUPS) as string[]) expect(text).toContain(`### ${title}`);
    expect(text).toContain('не выдумывайте');
  });

  it('содержит версию и ссылку на документацию', () => {
    const base = entries.find((e) => e.id === 'base-ui') as Entry;
    expect(text).toContain(base.version as string);
    expect(text).toContain(base.docs);
  });
});
