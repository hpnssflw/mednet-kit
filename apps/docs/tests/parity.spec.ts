// Паритет React (@mednet/ui) ↔ статика (@mednet/css): вычисленные стили пар элементов с одинаковым
// data-testid в покое, при наведении и после фокуса с клавиатуры (спека §14, спека пилота П13).
// Известные расхождения — в parity-known.json ("<id>.<состояние>.<свойство>": "причина");
// запись, которая больше не расходится, тоже валит тест — список не зарастает.
import { readFileSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';

const known: Record<string, string> = JSON.parse(
  readFileSync(new URL('./parity-known.json', import.meta.url), 'utf8'),
);

type State = 'hover' | 'focus';
interface Pair {
  id: string;
  states: State[];
  page: 'main' | 'dialog';
  size: boolean;
}

const B: State[] = ['hover', 'focus'];
const PAIRS: Pair[] = (
  [
    ['btn-default', B],
    ['btn-outline', B],
    ['btn-secondary', B],
    ['btn-ghost', B],
    ['btn-destructive', B],
    ['btn-link', B],
    ['btn-xs'],
    ['btn-sm'],
    ['btn-lg'],
    ['btn-icon', [], { size: true }],
    ['btn-disabled'],
    ['btn-invalid', ['focus']],
    ['badge-default'],
    ['badge-secondary'],
    ['badge-outline'],
    ['badge-destructive'],
    ['label'],
    ['input', ['focus']],
    ['input-invalid', ['focus']],
    ['select', ['focus']],
    ['textarea', ['focus']],
    ['checkbox', ['focus'], { size: true }],
    ['checkbox-checked', [], { size: true }],
    ['switch', ['focus'], { size: true }],
    ['switch-checked', [], { size: true }],
    ['radio', [], { size: true }],
    ['radio-checked', ['focus'], { size: true }],
    ['card'],
    ['card-title'],
    ['card-description'],
    ['alert'],
    ['alert-title'],
    ['alert-destructive'],
    ['tabs-list'],
    ['tab-active', ['focus']],
    ['tab', ['hover']],
    ['dialog', [], { page: 'dialog', size: true }],
    ['dialog-title', [], { page: 'dialog' }],
  ] as [string, State[]?, { page?: 'dialog'; size?: boolean }?][]
).map(([id, states = [], options = {}]) => ({
  id,
  states,
  page: options.page ?? 'main',
  size: Boolean(options.size),
}));

const URLS = {
  react: { main: '/parity/', dialog: '/parity/dialog/' },
  static: { main: '/parity/static.html', dialog: '/parity/static-dialog.html' },
} as const;

type Rgba = [number, number, number, number];
interface Snapshot {
  width: number;
  height: number;
  padding: number[];
  radius: number | 'pill';
  borderWidth: number;
  borderColor: Rgba | null;
  bg: number[];
  color: Rgba;
  fontSize: number;
  fontWeight: string;
  lineHeight: number | 'normal';
  shadow: { c: Rgba; n: number[]; inset: boolean }[];
  outline: { w: number; c: Rgba; off: number; st: string } | null;
  opacity: number;
  font?: string | null;
}
type Collected = Record<
  string,
  { rest: Snapshot; hover?: Snapshot; focus?: Snapshot | 'NOT_REACHED' } | null
>;

/** Выполняется в странице: вычисленные стили элемента с data-testid. */
function snapshotInPage(id: string): Snapshot | null {
  const element = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (!element) return null;
  const w = window as unknown as { __cv?: CanvasRenderingContext2D };
  const cv = (w.__cv ??= document
    .createElement('canvas')
    .getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D);
  const rgba = (c: string): Rgba => {
    cv.clearRect(0, 0, 1, 1);
    cv.fillStyle = '#000';
    cv.fillStyle = c;
    cv.fillRect(0, 0, 1, 1);
    const d = cv.getImageData(0, 0, 1, 1).data;
    return [d[0]!, d[1]!, d[2]!, +(d[3]! / 255).toFixed(2)];
  };
  // Фон, который видит человек: заливка элемента поверх заливок предков (до непрозрачной).
  const effectiveBg = (node: HTMLElement) => {
    const layers: Rgba[] = [];
    for (let n: HTMLElement | null = node; n; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] === 1) break;
    }
    let out = [255, 255, 255];
    for (const [r, g, b, a] of layers.reverse()) {
      out = [r * a + out[0]! * (1 - a), g * a + out[1]! * (1 - a), b * a + out[2]! * (1 - a)];
    }
    return out.map(Math.round);
  };
  const shadows = (value: string) =>
    value === 'none'
      ? []
      : value
          .split(/,(?![^(]*\))/)
          .map((part) => part.trim())
          .map((part) => {
            const col =
              part.match(
                /^(rgba?\([^)]*\)|oklab\([^)]*\)|oklch\([^)]*\)|color\([^)]*\)|#[0-9a-f]+)/i,
              )?.[0] ?? '';
            const n = part
              .replace(col, '')
              .trim()
              .split(/\s+/)
              .filter((token) => token.endsWith('px'))
              .map(parseFloat);
            return { c: rgba(col), n, inset: part.includes('inset') };
          })
          .filter((shadow) => shadow.c[3] > 0 && shadow.n.some((v) => v !== 0));
  const s = getComputedStyle(element);
  const r = element.getBoundingClientRect();
  const radius = parseFloat(s.borderTopLeftRadius);
  return {
    width: r.width,
    height: r.height,
    padding: [s.paddingTop, s.paddingRight, s.paddingBottom, s.paddingLeft].map(parseFloat),
    radius: radius >= Math.min(r.height, r.width) / 2 - 0.5 ? 'pill' : radius,
    borderWidth: parseFloat(s.borderTopWidth),
    borderColor: parseFloat(s.borderTopWidth) > 0 ? rgba(s.borderTopColor) : null,
    bg: effectiveBg(element),
    color: rgba(s.color),
    fontSize: parseFloat(s.fontSize),
    fontWeight: s.fontWeight,
    lineHeight: s.lineHeight === 'normal' ? 'normal' : parseFloat(s.lineHeight),
    shadow: shadows(s.boxShadow),
    outline:
      s.outlineStyle === 'none' || parseFloat(s.outlineWidth) === 0
        ? null
        : {
            w: parseFloat(s.outlineWidth),
            c: rgba(s.outlineColor),
            off: parseFloat(s.outlineOffset),
            st: s.outlineStyle,
          },
    opacity: Number(s.opacity),
  };
}

/** Шрифт, которым Chromium реально нарисовал текст (CDP), — font-family этого не покажет. */
async function renderedFont(page: Page, id: string) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
  const { nodeId } = await cdp.send('DOM.querySelector', {
    nodeId: root.nodeId,
    selector: `[data-testid="${id}"]`,
  });
  let name: string | null = null;
  try {
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    name = fonts.sort((a, b) => b.glyphCount - a.glyphCount)[0]?.familyName ?? null;
  } catch {
    name = null;
  }
  await cdp.detach();
  return name;
}

async function tabTo(page: Page, id: string) {
  await page.mouse.click(2, 2);
  for (let i = 0; i < 80; i += 1) {
    await page.keyboard.press('Tab');
    const reached = await page.evaluate((testId) => {
      const element = document.querySelector(`[data-testid="${testId}"]`);
      return (
        !!element &&
        (element === document.activeElement || element.contains(document.activeElement))
      );
    }, id);
    if (reached) return true;
  }
  return false;
}

async function collect(browser: Browser, side: keyof typeof URLS): Promise<Collected> {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const result: Collected = {};
  for (const kind of ['main', 'dialog'] as const) {
    await page.goto(URLS[side][kind]);
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content: '*,*::before,*::after{transition:none!important;animation:none!important}',
    });
    await page.waitForTimeout(150);
    for (const pair of PAIRS.filter((p) => p.page === kind)) {
      const rest = await page.evaluate(snapshotInPage, pair.id);
      if (!rest) {
        result[pair.id] = null;
        continue;
      }
      rest.font = await renderedFont(page, pair.id);
      const entry: NonNullable<Collected[string]> = { rest };
      if (pair.states.includes('hover')) {
        await page.locator(`[data-testid="${pair.id}"]`).first().hover();
        await page.waitForTimeout(50);
        entry.hover = (await page.evaluate(snapshotInPage, pair.id)) ?? undefined;
        await page.mouse.move(2, 2);
      }
      if (pair.states.includes('focus')) {
        entry.focus = (await tabTo(page, pair.id))
          ? ((await page.evaluate(snapshotInPage, pair.id)) ?? 'NOT_REACHED')
          : 'NOT_REACHED';
        await page.mouse.click(2, 2);
      }
      result[pair.id] = entry;
    }
  }
  await page.close();
  return result;
}

const TOL = { px: 0.5, ch: 3, alpha: 0.02 };
const fmtC = (c: Rgba | number[] | null) =>
  c
    ? c[3] === undefined || c[3] === 1
      ? `rgb(${c.slice(0, 3).join(',')})`
      : `rgba(${c.join(',')})`
    : '—';
const eqC = (a: number[] | null, b: number[] | null) =>
  (!a && !b) ||
  (!!a &&
    !!b &&
    a.slice(0, 3).every((v, i) => Math.abs(v - b[i]!) <= TOL.ch) &&
    Math.abs((a[3] ?? 1) - (b[3] ?? 1)) <= TOL.alpha);
const eqN = (a: unknown, b: unknown) =>
  typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) <= TOL.px : a === b;
const fmtSh = (list: Snapshot['shadow']) =>
  list.length
    ? list.map((s) => `${s.inset ? 'inset ' : ''}${s.n.join(' ')} ${fmtC(s.c)}`).join(' + ')
    : 'none';
const eqSh = (a: Snapshot['shadow'], b: Snapshot['shadow']) =>
  a.length === b.length &&
  a.every(
    (s, i) =>
      s.inset === b[i]!.inset &&
      s.n.length === b[i]!.n.length &&
      s.n.every((v, j) => Math.abs(v - b[i]!.n[j]!) <= TOL.px) &&
      eqC(s.c, b[i]!.c),
  );

interface Row {
  key: string;
  react: string;
  static: string;
  ok: boolean;
}

function compare(pair: Pair, R: Collected[string], S: Collected[string]): Row[] {
  const rows: Row[] = [];
  const add = <T>(
    state: string,
    prop: string,
    a: T,
    b: T,
    eq: (x: T, y: T) => boolean,
    fmt: (v: T) => string = String,
  ) =>
    rows.push({ key: `${pair.id}.${state}.${prop}`, react: fmt(a), static: fmt(b), ok: eq(a, b) });
  for (const state of ['rest', ...pair.states] as const) {
    const a = R?.[state];
    const b = S?.[state];
    if (!a || !b || a === 'NOT_REACHED' || b === 'NOT_REACHED') {
      rows.push({
        key: `${pair.id}.${state}.present`,
        react: a ? String(a === 'NOT_REACHED' ? a : 'ok') : 'MISSING',
        static: b ? String(b === 'NOT_REACHED' ? b : 'ok') : 'MISSING',
        ok: false,
      });
      continue;
    }
    if (state === 'rest') {
      add(state, 'height', a.height, b.height, eqN, (v) => v.toFixed(1));
      if (pair.size) add(state, 'width', a.width, b.width, eqN, (v) => v.toFixed(1));
      add(
        state,
        'padding',
        a.padding,
        b.padding,
        (x, y) => x.every((v, i) => eqN(v, y[i])),
        (v) => v.join(' '),
      );
      add(state, 'radius', a.radius, b.radius, eqN, (v) =>
        typeof v === 'number' ? v.toFixed(1) : v,
      );
      add(state, 'border-width', a.borderWidth, b.borderWidth, eqN);
      add(state, 'border-color', a.borderColor, b.borderColor, eqC, fmtC);
      add(state, 'background', a.bg, b.bg, eqC, fmtC);
      add(state, 'color', a.color, b.color, eqC, fmtC);
      add(state, 'font (rendered)', a.font, b.font, (x, y) => x === y);
      add(state, 'font-size', a.fontSize, b.fontSize, eqN);
      add(state, 'font-weight', a.fontWeight, b.fontWeight, (x, y) => x === y);
      add(state, 'line-height', a.lineHeight, b.lineHeight, eqN);
      add(state, 'box-shadow', a.shadow, b.shadow, eqSh, fmtSh);
      add(state, 'opacity', a.opacity, b.opacity, (x, y) => Math.abs(x - y) < 0.01);
    } else if (state === 'hover') {
      add(state, 'background', a.bg, b.bg, eqC, fmtC);
      add(state, 'color', a.color, b.color, eqC, fmtC);
    } else {
      add(state, 'border-color', a.borderColor, b.borderColor, eqC, fmtC);
      add(state, 'box-shadow (ring)', a.shadow, b.shadow, eqSh, fmtSh);
      add(
        state,
        'outline',
        a.outline,
        b.outline,
        (x, y) => (!x && !y) || (!!x && !!y && eqN(x.w, y.w) && eqC(x.c, y.c) && eqN(x.off, y.off)),
        (o) => (o ? `${o.st} ${o.w}px ${fmtC(o.c)} off ${o.off}` : 'none'),
      );
    }
  }
  return rows;
}

test('паритет React (@mednet/ui) ↔ статика (@mednet/css)', async ({ browser }) => {
  test.setTimeout(180_000);
  const react = await collect(browser, 'react');
  const stat = await collect(browser, 'static');
  const rows = PAIRS.flatMap((pair) =>
    compare(pair, react[pair.id] ?? null, stat[pair.id] ?? null),
  );
  const bad = rows.filter((row) => !row.ok);
  const unexpected = bad
    .filter((row) => !known[row.key])
    .map((row) => `${row.key}: React ${row.react} ≠ статика ${row.static}`);
  const badKeys = new Set(bad.map((row) => row.key));
  const stale = Object.keys(known).filter((key) => !badKeys.has(key));
  console.log(
    `${rows.length} проверок, совпало ${rows.length - bad.length}, известных расхождений ${bad.length - unexpected.length}`,
  );
  expect(unexpected, 'новые расхождения React и статики').toEqual([]);
  expect(stale, 'записи parity-known.json, которые больше не расходятся, — удалите').toEqual([]);
});
