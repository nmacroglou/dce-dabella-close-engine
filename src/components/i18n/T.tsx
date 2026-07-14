import { memo } from "react";
import { useTranslated } from "@/hooks/useTranslator";

interface TProps {
  /** English source string. Rendered as-is when lang is "en". */
  children: string;
  /** Optional translation context to help the AI pick the right register. */
  context?: string;
}

/**
 * Inline translator for hardcoded English strings. Wrap any user-visible
 * literal that isn't already routed through `useT()` so it flips to the
 * active language via the cached translator.
 *
 *   <T>Compare all</T>
 *   <T context="Sales script line">"Most people at this point…"</T>
 */
export default memo(function T({ children, context }: TProps) {
  const out = useTranslated(children, context);
  return <>{out}</>;
});
