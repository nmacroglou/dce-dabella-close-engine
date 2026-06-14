// Brand palette + page dimensions — single source of truth for the PDF.
export type RGB = readonly [number, number, number];

export const LIME       = [141, 198, 63] as const;
export const LIME_DEEP  = [108, 158, 42] as const;
export const FOREST     = [27, 64, 30] as const;
export const FOREST_INK = [12, 30, 14] as const;
export const INK        = [15, 23, 17] as const;
export const GRAPHITE   = [71, 85, 75] as const;
export const SLATE      = [120, 134, 122] as const;
export const MIST       = [196, 207, 197] as const;
export const PAPER      = [251, 250, 246] as const;
export const CARD       = [255, 255, 255] as const;
export const CREAM      = [241, 244, 235] as const;
export const SAND       = [228, 232, 219] as const;
export const BORDER     = [220, 226, 215] as const;
export const WHITE      = [255, 255, 255] as const;
export const ACCENT     = [59, 130, 246] as const;
export const POSITIVE   = [46, 125, 50] as const;
export const NEGATIVE   = [185, 28, 28] as const;
export const NEG_SOFT   = [253, 237, 237] as const;
export const POS_SOFT   = [233, 246, 234] as const;

// A4 portrait, mm
export const PW = 210;
export const PH = 297;
