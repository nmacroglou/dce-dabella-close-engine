// Prefetch lazy route chunks on hover/focus so navigation feels instant.
// Keep this map in sync with the lazy() imports in src/App.tsx.
const PREFETCH: Record<string, () => Promise<unknown>> = {
  "/": () => import("@/pages/Index.tsx"),
  "/deals": () => import("@/pages/Deals.tsx"),
  "/dashboard": () => import("@/pages/Dashboard.tsx"),
  "/pipeline": () => import("@/pages/Pipeline.tsx"),
  "/ledger": () => import("@/pages/Ledger.tsx"),
  "/admin": () => import("@/pages/Admin.tsx"),
  "/auth": () => import("@/pages/Auth.tsx"),
};

const warmed = new Set<string>();

export function prefetchRoute(path: string) {
  if (warmed.has(path)) return;
  const loader = PREFETCH[path];
  if (!loader) return;
  warmed.add(path);
  // Fire and forget — browser will idle-fetch the JS chunk.
  loader().catch(() => warmed.delete(path));
}

export function usePrefetchOnHover(path: string) {
  return {
    onMouseEnter: () => prefetchRoute(path),
    onFocus: () => prefetchRoute(path),
    onTouchStart: () => prefetchRoute(path),
  };
}
