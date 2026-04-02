import { useCallback, useState } from "react";

/** Hook for toggling items in a Set-based state */
export function useSetToggle<T>(initial?: Iterable<T>) {
  const [set, setSet] = useState<Set<T>>(new Set(initial));

  const toggle = useCallback((item: T) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }, []);

  const has = useCallback((item: T) => set.has(item), [set]);
  const size = set.size;

  return { set, toggle, has, size } as const;
}
