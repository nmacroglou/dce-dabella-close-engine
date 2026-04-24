import { createContext, useContext, useState, type ReactNode } from "react";

interface ActiveDealContextValue {
  activeDealId: string | null;
  setActiveDealId: (id: string | null) => void;
}

const ActiveDealContext = createContext<ActiveDealContextValue | undefined>(undefined);

const STORAGE_KEY = "active_deal_id";

export function ActiveDealProvider({ children }: { children: ReactNode }) {
  const [activeDealId, setActiveDealIdState] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  const setActiveDealId = (id: string | null) => {
    setActiveDealIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ActiveDealContext.Provider value={{ activeDealId, setActiveDealId }}>
      {children}
    </ActiveDealContext.Provider>
  );
}

export function useActiveDeal() {
  const ctx = useContext(ActiveDealContext);
  if (!ctx) throw new Error("useActiveDeal must be used within ActiveDealProvider");
  return ctx;
}
