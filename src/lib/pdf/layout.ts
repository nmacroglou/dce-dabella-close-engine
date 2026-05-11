// Centralized layout grid for all PDF pages. Page renderers must derive
// their column geometry from these constants instead of repeating the
// `(PW - 44 - 8) / 2` math.

import { PW } from "./theme";

export const MARGIN = 22;          // outer page margin (mm)
export const GUTTER = 8;           // gap between paired columns

export const CONTENT_W = PW - MARGIN * 2;            // 166mm
export const HALF_W = (CONTENT_W - GUTTER) / 2;      // 79mm

export const COL_LEFT_X = MARGIN;
export const COL_RIGHT_X = MARGIN + HALF_W + GUTTER;

// Vertical rhythm tokens — used so every section breathes the same.
export const RHYTHM = {
  /** Y of the first content block on interior pages (under sectionHeader). */
  sectionTop: 78,
  /** Vertical gap between major blocks. */
  blockGap: 14,
  /** Tight gap between a label and its value. */
  innerGap: 4,
} as const;

/** Page edge-to-edge content rect (handy for full-bleed elements). */
export const PAGE = {
  left: MARGIN,
  right: PW - MARGIN,
  width: CONTENT_W,
} as const;
