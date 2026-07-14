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
    return Array.isArray(out) && out.length === texts.length ? out : texts;
  }, []);
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
