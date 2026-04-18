import { en } from "./en";
import { pt } from "./pt";
import { DEFAULT_LOCALE, type Dictionary, type Locale } from "./types";

export { DEFAULT_LOCALE, LOCALES, type Dictionary, type Locale } from "./types";

// Bundled dictionary table. Using a plain object means the chosen dictionary
// is resolved at module load (no dynamic import, no async), which keeps
// Server Components synchronous and avoids a waterfall between render and
// message loading. The bundle impact is trivial — two TS objects totalling
// a few KB — and well within the "zero runtime deps" constraint for i18n
// on this project.
const DICTIONARIES: Record<Locale, Dictionary> = {
  pt,
  en,
};

/**
 * Look up the Dictionary for a given locale. Falls back to the default locale
 * if an unknown string slips through — shouldn't happen in practice because
 * the only entry points are the PT and EN route pages (both hard-coded), but
 * keeping the guard means the function is safe to call with an untrusted
 * input (e.g. a future query-param toggle).
 */
export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

/**
 * Resolve a Locale from the request pathname. Used by the root layout's
 * `<html lang>` attribute and by `LocaleToggle` so it can highlight the
 * correct side.
 *
 * Rules:
 *   - "/en" or "/en/..." → "en"
 *   - anything else        → "pt" (default)
 *
 * The check is deliberately string-prefix-based (not regex) so it works with
 * both server-rendered pathnames (from `headers()`) and client pathnames
 * (from `usePathname()`).
 */
export function getLocaleFromPathname(pathname: string | null | undefined): Locale {
  if (!pathname) return DEFAULT_LOCALE;
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  return DEFAULT_LOCALE;
}
