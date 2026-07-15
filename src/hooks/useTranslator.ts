import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { prettyTag } from "@/data/inspectionTemplates";

/** Batch translate arbitrary strings via the translate-text edge function. */
export function useTranslateBatch() {
  return useCallback(async (texts: string[], target: "en" | "es", context?: string) => {
    if (texts.length === 0) return [];
    const { data, error } = await supabase.functions.invoke("translate-text", {
      body: { texts, target_lang: target, context },
    });
    if (error) throw error;
    const out = (data as { texts?: string[] })?.texts;
    if (!Array.isArray(out) || out.length !== texts.length) {
      throw new Error("Translation response did not match the requested captions");
    }
    return out;
  }, []);
}

// ─── Static-string cache (client-side, persistent) ──────────────────────
// Any hardcoded English string can be run through this cache to be shown in
// the active language. Cache is per-language, keyed by the exact English
// source; identical strings across components share one AI round-trip.
type StaticCache = Record<string, Record<string, string>>; // { es: { "Compare all": "Comparar todo" } }
const STATIC_CACHE_KEY = "dce-static-i18n-cache";
function loadStaticCache(): StaticCache {
  try {
    const raw = localStorage.getItem(STATIC_CACHE_KEY);
    return raw ? (JSON.parse(raw) as StaticCache) : {};
  } catch { return {}; }
}
function saveStaticCache(c: StaticCache) {
  try { localStorage.setItem(STATIC_CACHE_KEY, JSON.stringify(c)); } catch { /* no-op */ }
}

// Module-level singleton so all hook consumers share the cache + inflight set.
const staticCacheRef = { current: loadStaticCache() };
const staticInflight = new Set<string>(); // keys: `${lang}::${src}`
const staticSubscribers = new Set<() => void>();
function notifyStaticSubscribers() { staticSubscribers.forEach((cb) => cb()); }

/**
 * Translate a fixed array of hardcoded English strings for display in the
 * active language. Returns the array unchanged when lang is "en" or while the
 * translation is still fetching (falls back gracefully).
 */
export function useTranslatedList(source: readonly string[], context?: string): string[] {
  const { lang } = useLanguage();
  const [, bump] = useState(0);

  useEffect(() => {
    const cb = () => bump((n) => n + 1);
    staticSubscribers.add(cb);
    return () => { staticSubscribers.delete(cb); };
  }, []);

  useEffect(() => {
    if (lang === "en") return;
    const bucket = (staticCacheRef.current[lang] ??= {});
    const missing = Array.from(new Set(source.filter((s) => s && !bucket[s] && !staticInflight.has(`${lang}::${s}`))));
    if (missing.length === 0) return;
    missing.forEach((s) => staticInflight.add(`${lang}::${s}`));
    supabase.functions.invoke("translate-text", {
      body: { texts: missing, target_lang: lang, context },
    }).then(({ data, error }) => {
      if (!error && Array.isArray((data as { texts?: string[] })?.texts)) {
        const out = (data as { texts: string[] }).texts;
        missing.forEach((s, i) => { bucket[s] = out[i] || s; });
        saveStaticCache(staticCacheRef.current);
        notifyStaticSubscribers();
      }
    }).catch(() => { /* leave English fallback */ })
      .finally(() => { missing.forEach((s) => staticInflight.delete(`${lang}::${s}`)); });
  }, [lang, source, context]);

  if (lang === "en") return source.slice();
  const bucket = staticCacheRef.current[lang] ?? {};
  return source.map((s) => bucket[s] || s);
}

/** Single-string variant. */
export function useTranslated(source: string, context?: string): string {
  const list = useTranslatedList([source], context);
  return list[0] ?? source;
}

// ─── Tag label display cache ────────────────────────────────────────────
// Tag identifiers stay in the DB as snake_case (English). For display we
// translate their pretty form once per language and cache in localStorage.
type TagCache = Record<string, Record<string, string>>; // { es: { granule_loss: "Pérdida de gránulos" } }
const CACHE_KEY = "dce-tag-label-cache";

function loadCache(): TagCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as TagCache) : {};
  } catch {
    return {};
  }
}
function saveCache(cache: TagCache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* no-op */ }
}

/**
 * Returns a `label(tag)` function that renders the display label for a tag in
 * the current language. English falls back to `prettyTag`; Spanish looks up
 * (and lazily fetches, batched) a translation.
 */
export function useTagLabel(allTags: string[]) {
  const { lang } = useLanguage();
  const translate = useTranslateBatch();
  const [tick, setTick] = useState(0);
  const cacheRef = useRef<TagCache>(loadCache());
  const inflightRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (lang !== "es") return;
    const bucket = (cacheRef.current[lang] ??= {});
    const missing = Array.from(new Set(allTags.filter((t) => t && !bucket[t] && !inflightRef.current.has(t))));
    if (missing.length === 0) return;
    missing.forEach((t) => inflightRef.current.add(t));
    const pretty = missing.map((t) => prettyTag(t));
    translate(pretty, "es", "Short 1–3 word display labels for photo inspection tags. Keep concise. Title Case.")
      .then((res) => {
        missing.forEach((tag, i) => { bucket[tag] = res[i] || prettyTag(tag); });
        saveCache(cacheRef.current);
        setTick((n) => n + 1);
      })
      .catch(() => { /* keep English fallback */ })
      .finally(() => { missing.forEach((t) => inflightRef.current.delete(t)); });
  }, [allTags, lang, translate]);

  return useCallback((tag: string) => {
    if (lang === "en") return prettyTag(tag);
    const cached = cacheRef.current[lang]?.[tag];
    return cached || prettyTag(tag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, tick]);
}
