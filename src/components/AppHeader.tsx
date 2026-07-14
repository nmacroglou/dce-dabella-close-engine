import type { ComponentType } from "react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Moon, Sun, LayoutDashboard, Briefcase, Wrench, LogOut, GitBranch, ShieldCheck,
  ShieldAlert, Wallet, Sun as SunIcon, Menu, Trophy, BookOpen, Target, CalendarDays,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import { useDeal } from "@/hooks/useDeals";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsAdmin } from "@/hooks/useUserRole";
import { usePrefetchOnHover } from "@/hooks/usePrefetchRoute";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import PublishStatusBadge from "@/components/PublishStatusBadge";
import OwnerScopeFilter from "@/components/OwnerScopeFilter";
import dabellaLogo from "@/assets/dabella-logo.png";

type NavEntry = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end: boolean;
};

const SELL_CLUSTER: NavEntry[] = [
  { to: "/", label: "Engine", icon: Wrench, end: true },
  { to: "/deals", label: "Deals", icon: Briefcase, end: false },
  { to: "/pipeline", label: "Pipeline", icon: GitBranch, end: false },
];

const INSIGHTS_CLUSTER: NavEntry[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: false },
  { to: "/forecast", label: "Forecast", icon: Target, end: false },
  { to: "/ledger", label: "Ledger", icon: Wallet, end: false },
  { to: "/energy-lens", label: "Energy", icon: SunIcon, end: false },
];

const OPS_CLUSTER: NavEntry[] = [
  { to: "/installs", label: "Installs", icon: CalendarDays, end: false },
  { to: "/incidents", label: "Incidents", icon: ShieldAlert, end: false },
  { to: "/manage-up", label: "Manage Up", icon: Trophy, end: false },
];

const NAV_ES: Record<string, string> = {
  Engine: "Motor",
  Deals: "Tratos",
  Pipeline: "Embudo",
  Dashboard: "Panel",
  Forecast: "Pronóstico",
  Ledger: "Libro",
  Energy: "Energía",
  Installs: "Instalaciones",
  Incidents: "Incidencias",
  "Manage Up": "Gestión",
  Admin: "Admin",
};


function NavItem({ to, label, icon: Icon, end }: NavEntry) {
  const prefetch = usePrefetchOnHover(to);
  const { lang } = useLanguage();
  const shown = lang === "es" ? (NAV_ES[label] ?? label) : label;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={to}
          end={end}
          {...prefetch}
          aria-label={shown}
          className={({ isActive }) =>
            `group relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all pressable ${
              isActive
                ? "bg-primary/15 text-primary border border-primary/20"
                : "text-slate-300 hover:text-foreground hover:bg-muted/45"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-primary" : ""}`} />
              <span className="hidden xl:inline">{shown}</span>
            </>
          )}
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[11px] font-semibold">
        {shown}
      </TooltipContent>
    </Tooltip>
  );
}

function ClusterDivider() {
  return <span className="h-4 w-px bg-hairline/50 mx-2" aria-hidden />;
}

function NavCluster({ items, label }: { items: NavEntry[]; label: string }) {
  return (
    <div className="flex items-center gap-1" aria-label={label}>
      {items.map((item) => (
        <NavItem key={item.to} {...item} />
      ))}
    </div>
  );
}


function MobileNavItem({ to, label, icon: Icon, end, onNavigate }: NavEntry & { onNavigate: () => void }) {
  const { lang } = useLanguage();
  const shown = lang === "es" ? (NAV_ES[label] ?? label) : label;
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all pressable ${
            isActive
              ? "bg-primary/15 text-primary border border-primary/25 shadow-[0_0_12px_-4px_hsl(var(--primary)/0.2)]"
              : "text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent"
          }`
        }
    >
      <Icon className="h-4 w-4" />
      {shown}
    </NavLink>
  );
}


function MobileClusterLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </div>
  );
}

export default function AppHeader() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { activeDealId, setActiveDealId } = useActiveDeal();
  const { data: activeDeal } = useDeal(activeDealId);
  const { dark, toggle } = useDarkMode();
  const { lang, toggle: toggleLang, t } = useLanguage();
  const { isAdmin } = useIsAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  const opsCluster = isAdmin
    ? [...OPS_CLUSTER, { to: "/admin", label: "Admin", icon: ShieldCheck, end: false } as NavEntry]
    : OPS_CLUSTER;

  const handleSignOut = async () => {
    setActiveDealId(null);
    await signOut();
    navigate("/auth");
  };

  const initials = (user?.user_metadata?.full_name || user?.email || "?")
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const homeownerLabel = activeDeal
    ? `${activeDeal.homeowner1 || "Untitled"}${activeDeal.homeowner2 ? ` & ${activeDeal.homeowner2}` : ""}`
    : null;

  return (
    <TooltipProvider delayDuration={200}>
      <header className="sticky top-0 z-40 px-3 sm:px-4 lg:px-6 pt-2.5 pb-2 bg-gradient-to-b from-background via-background/95 to-background/0">
        <div className="max-w-[92rem] mx-auto flex items-center gap-3 min-h-11 px-3 rounded-xl border border-hairline bg-card/90 backdrop-blur-xl shadow-[var(--shadow-md)] relative">

          {/* Left: Brand + active-deal status */}
          <Link to="/" className="flex items-center gap-2 pr-3 border-r border-hairline/60 shrink-0 min-w-0 group">
            <img src={dabellaLogo} alt="DaBella" className="h-5 w-auto" />
            <div className="hidden sm:flex items-center gap-1.5 leading-none min-w-0">
              <span className="text-[12px] font-display font-extrabold text-white tracking-tight whitespace-nowrap">
                Close<span className="text-primary">.</span>
              </span>
              {activeDeal ? (
                <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/25 max-w-[160px]">
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                  <span className="text-[10px] font-semibold text-primary truncate">{homeownerLabel}</span>
                </span>
              ) : (
                <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/40 border border-hairline/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t("Idle", "Inactivo")}</span>
                </span>
              )}

            </div>
          </Link>

          {/* Center: clustered nav */}
          <nav className="hidden md:flex flex-1 items-center justify-center px-2 overflow-visible">
            <NavCluster items={SELL_CLUSTER} label={t("Sell", "Vender")} />
            <ClusterDivider />
            <NavCluster items={INSIGHTS_CLUSTER} label={t("Insights", "Análisis")} />
            <ClusterDivider />
            <NavCluster items={opsCluster} label={t("Operations", "Operaciones")} />
          </nav>


          {/* Right: Utility cluster */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-hairline/60 shrink-0">
            <div className="hidden 2xl:flex items-center gap-1.5">
              <OwnerScopeFilter />
              <PublishStatusBadge />
            </div>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                    className="md:hidden rounded-md bg-muted/50 border border-hairline p-1.5 hover:bg-muted transition-colors pressable"
                  aria-label="Open navigation"
                >
                  <Menu className="h-3.5 w-3.5 text-white" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-3">
                <div className="flex items-center gap-2 mb-4 pt-1">
                  <img src={dabellaLogo} alt="DaBella" className="h-7 w-auto" />
                  <h2 className="font-display font-extrabold text-base">
                    Close<span className="text-primary">.</span>Engine
                  </h2>
                </div>
                <nav className="flex flex-col gap-0.5">
                  <MobileClusterLabel>{t("Sell", "Vender")}</MobileClusterLabel>
                  {SELL_CLUSTER.map((item) => (
                    <MobileNavItem key={item.to} {...item} onNavigate={() => setMobileOpen(false)} />
                  ))}
                  <MobileClusterLabel>{t("Insights", "Análisis")}</MobileClusterLabel>
                  {INSIGHTS_CLUSTER.map((item) => (
                    <MobileNavItem key={item.to} {...item} onNavigate={() => setMobileOpen(false)} />
                  ))}
                  <MobileClusterLabel>{t("Operations", "Operaciones")}</MobileClusterLabel>
                  {opsCluster.map((item) => (
                    <MobileNavItem key={item.to} {...item} onNavigate={() => setMobileOpen(false)} />
                  ))}
                </nav>

                <div className="mt-4 pt-3 border-t border-hairline space-y-2">
                  <OwnerScopeFilter />
                  <PublishStatusBadge />
                </div>
              </SheetContent>
            </Sheet>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleLang}
                  className="rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-300 hover:text-white hover:bg-white/10 border border-hairline/60 hover:border-primary/40 transition-all pressable"
                  aria-label={`Switch language, current ${lang === "en" ? "English" : "Spanish"}`}
                >
                  <span className={lang === "en" ? "text-primary" : "opacity-50"}>EN</span>
                  <span className="mx-0.5 opacity-40">/</span>
                  <span className={lang === "es" ? "text-primary" : "opacity-50"}>ES</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[11px]">Language / Idioma</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggle}
                  className="rounded-md p-1.5 text-slate-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/5 transition-all pressable"
                  aria-label="Toggle dark mode"
                >
                  {dark ? <Sun className="h-3.5 w-3.5 text-warning" /> : <Moon className="h-3.5 w-3.5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[11px]">Theme</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="h-7 w-7 rounded-full text-[10px] font-bold flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity gradient-brand pressable shadow-[0_0_0_1.5px_hsl(var(--card)),0_0_10px_-2px_hsl(var(--primary)/0.6)]"
                  aria-label="Account"
                >
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {user?.user_metadata?.full_name || user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/deals")}>
                  <Briefcase className="h-4 w-4 mr-2" /> {t("My deals", "Mis tratos")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="h-4 w-4 mr-2" /> {t("Dashboard", "Panel")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/manual")}>
                  <BookOpen className="h-4 w-4 mr-2" /> {t("How to use this app", "Cómo usar la app")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> {t("Sign out", "Cerrar sesión")}
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
