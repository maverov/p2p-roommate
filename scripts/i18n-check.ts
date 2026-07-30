/**
 * i18n integrity gate.
 *
 * The compiler already guarantees locale parity structurally — `locales/index.ts`
 * types every locale as `Record<Locale, Messages>` against `bg` — but three
 * classes of breakage are invisible to it, and all three are the ones that reach
 * production as visibly broken UI:
 *
 *   1. a key present in `bg` but empty/whitespace in `en`;
 *   2. ICU placeholder drift — `{count}` in one locale, `{total}` in another,
 *      which throws at render time rather than at build time;
 *   3. keys nobody reads any more, which quietly inflate every TMS invoice.
 *
 * (1) and (2) fail the run. (3) is reported as a warning: the call-site scan is
 * a regex over source text, so a key resolved through a lookup table can look
 * unused when it is not — failing on that would make the gate untrustworthy.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(__dirname, '..');
const LOCALES_DIR = join(ROOT, 'locales');

/** `bg` is the default locale and where product copy is written first. */
const REFERENCE_LOCALE = 'bg';

/** Directories scanned for `t('…')` call sites. */
const SOURCE_DIRS = ['app', 'components', 'features', 'lib', 'hooks'];

type Flat = Map<string, string>;

const errors: string[] = [];
const warnings: string[] = [];

/* ── message loading ────────────────────────────────────────────────────── */

function localeDirs(): string[] {
  return readdirSync(LOCALES_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function flatten(value: unknown, prefix: string, out: Flat) {
  if (typeof value === 'string') {
    out.set(prefix, value);
    return;
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, out);
    }
    return;
  }

  errors.push(`${prefix}: messages must be strings, got ${typeof value}`);
}

function loadLocale(locale: string): Flat {
  const dir = join(LOCALES_DIR, locale);
  const flat: Flat = new Map();

  for (const file of readdirSync(dir).filter((name) => name.endsWith('.json')).sort()) {
    const namespace = file.replace(/\.json$/, '');
    flatten(JSON.parse(readFileSync(join(dir, file), 'utf8')), namespace, flat);
  }

  return flat;
}

/* ── ICU placeholders ───────────────────────────────────────────────────── */

/**
 * Argument names only. Plural branch bodies (`one {# нощувка}`) start with `#`
 * or a letter-less token, so they never look like an argument.
 */
function placeholders(message: string): Set<string> {
  const names = new Set<string>();

  for (const match of message.matchAll(/\{\s*([A-Za-z0-9_]+)\s*[,}]/g)) {
    names.add(match[1]);
  }

  return names;
}

/* ── call-site scan ─────────────────────────────────────────────────────── */

const DECLARATION =
  /const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*(?:\{[^}]*namespace:\s*)?['"]([^'"]+)['"]/g;

/**
 * Catches translators that are not bound by a plain `const x =` — the
 * `const [user, t] = await Promise.all([...])` shape, for one. The binding name
 * is unrecoverable by regex, so these fall back to the conventional `t`.
 */
const ANY_TRANSLATOR =
  /(?:useTranslations|getTranslations)\(\s*(?:\{[^}]*namespace:\s*)?['"]([^'"]+)['"]/g;

const FALLBACK_VARIABLE = 't';

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') sourceFiles(path, acc);
    } else if (/\.tsx?$/.test(entry.name)) {
      acc.push(path);
    }
  }

  return acc;
}

/**
 * Returns the keys a file reads literally, plus the prefixes it reads
 * dynamically. A dynamic read covers everything beneath it:
 *
 *   t('detail.about')             → key   `ns.detail.about`
 *   t(`propertyType.${value}`)    → keys  `ns.propertyType.*`
 *   t(STATUS_KEYS[status])        → keys  `ns.*` (the argument is opaque here)
 *
 * A translator variable can be declared more than once in a file — one per
 * component — so every namespace it is ever bound to is considered.
 */
function usage(): { keys: Set<string>; prefixes: string[] } {
  const keys = new Set<string>();
  const prefixes: string[] = [];

  for (const dir of SOURCE_DIRS) {
    for (const file of sourceFiles(join(ROOT, dir))) {
      const source = readFileSync(file, 'utf8');
      const namespaces = new Map<string, Set<string>>();

      for (const match of source.matchAll(DECLARATION)) {
        const bound = namespaces.get(match[1]) ?? new Set<string>();
        bound.add(match[2]);
        namespaces.set(match[1], bound);
      }

      const declared = new Set([...namespaces.values()].flatMap((set) => [...set]));

      for (const match of source.matchAll(ANY_TRANSLATOR)) {
        if (declared.has(match[1])) continue;

        const bound = namespaces.get(FALLBACK_VARIABLE) ?? new Set<string>();
        bound.add(match[1]);
        namespaces.set(FALLBACK_VARIABLE, bound);
      }

      for (const [variable, bound] of namespaces) {
        const call = new RegExp(`\\b${variable.replace(/\$/g, '\\$')}\\(\\s*(.)`, 'g');

        for (const match of source.matchAll(call)) {
          const rest = source.slice(match.index! + match[0].length - 1);

          for (const namespace of bound) {
            const literal = /^['"]([^'"]+)['"]/.exec(rest);

            if (literal) {
              keys.add(`${namespace}.${literal[1]}`);
              continue;
            }

            const template = /^`([^`$]*)\$\{/.exec(rest);
            prefixes.push(template ? `${namespace}.${template[1]}` : namespace);
          }
        }
      }
    }
  }

  return { keys, prefixes };
}

/* ── checks ─────────────────────────────────────────────────────────────── */

const locales = localeDirs();

if (!locales.includes(REFERENCE_LOCALE)) {
  console.error(`i18n: reference locale "${REFERENCE_LOCALE}" has no message directory`);
  process.exit(1);
}

const catalogues = new Map(locales.map((locale) => [locale, loadLocale(locale)]));
const reference = catalogues.get(REFERENCE_LOCALE)!;

for (const [locale, messages] of catalogues) {
  for (const [key, value] of messages) {
    if (!value.trim()) {
      errors.push(`${locale}: "${key}" is empty`);
    }
  }

  if (locale === REFERENCE_LOCALE) continue;

  for (const key of reference.keys()) {
    if (!messages.has(key)) {
      errors.push(`${locale}: missing "${key}" (present in ${REFERENCE_LOCALE})`);
    }
  }

  for (const key of messages.keys()) {
    if (!reference.has(key)) {
      errors.push(`${locale}: unknown "${key}" (absent from ${REFERENCE_LOCALE})`);
    }
  }

  for (const [key, value] of messages) {
    const expected = reference.get(key);
    if (expected === undefined) continue;

    const want = placeholders(expected);
    const got = placeholders(value);
    const drift = [
      ...[...want].filter((name) => !got.has(name)).map((name) => `-{${name}}`),
      ...[...got].filter((name) => !want.has(name)).map((name) => `+{${name}}`),
    ];

    if (drift.length > 0) {
      errors.push(`${locale}: "${key}" placeholder mismatch (${drift.join(' ')})`);
    }
  }
}

const { keys: used, prefixes } = usage();

for (const key of reference.keys()) {
  if (used.has(key)) continue;
  if (prefixes.some((prefix) => key.startsWith(prefix))) continue;

  warnings.push(`unused: "${key}"`);
}

/* ── report ─────────────────────────────────────────────────────────────── */

const scanned = SOURCE_DIRS.map((dir) => relative(ROOT, join(ROOT, dir))).join(', ');

console.log(
  `i18n: ${reference.size} keys × ${locales.length} locales (${locales.join(', ')}), ` +
    `call sites scanned in ${scanned}`,
);

for (const warning of warnings) {
  console.warn(`  warn  ${warning}`);
}

for (const error of errors) {
  console.error(`  error ${error}`);
}

if (errors.length > 0) {
  console.error(`\ni18n: ${errors.length} problem(s) found`);
  process.exit(1);
}

console.log(`i18n: ok${warnings.length > 0 ? ` (${warnings.length} warning(s))` : ''}`);
