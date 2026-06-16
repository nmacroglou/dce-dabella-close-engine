import type { ComponentType } from "react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Moon, Sun, LayoutDashboard, Briefcase, Wrench, LogOut, GitBranch, ShieldCheck,
  ShieldAlert, Wallet, Sun as SunIcon, Menu, Trophy, BookOpen,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import { useDeal } from "@/hooks/useDeals";
import { useDarkMode } from "@/hooks/useDarkMode";
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
  { to: "/ledger", label: "Ledger", icon: Wallet, end: false },
  { to: "/energy-lens", label: "Energy", icon: SunIcon, end: false },
];

const OPS_CLUSTER: NavEntry[] = [
  { to: "/incidents", label: "Incidents", icon: ShieldAlert, end: false },
  { to: "/manage-up", label: "Manage Up", icon: Trophy, end: false },
];

function NavItem({ to, label, icon: Icon, end }: NavEntry) {
  const prefetch = usePrefetchOnHover(to);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink
          to={to}
          end={end}
          {...prefetch}
          aria-label={label}
          className={({ isActive }) =>
            `group relative flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[13px] font-bold whitespace-nowrap transition-all pressable ${
              isActive
                ? "bg-primary/25 text-primary border border-primary/30 shadow-[0_0_24px_-4px_hsl(var(--primary)/0.18),inset_0_1px_0_0_hsl(var(--primary)/0.12)]"
                : "text-slate-300 hover:text-white hover:bg-white/[0.06]"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-primary" : ""}`} />
              <span className="hidden 2xl:inline tracking-tight">{label}</span>
              {isActive && (
                <span className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 h-[3px] w-7 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
              )}
            </>
          )}
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-[11px] font-semibold">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function ClusterDivider() {
  return <span className="h-4 w-px bg-hairline/70 mx-1.5" aria-hidden />;
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
      {label}
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
        <div className="max-w-7xl mx-auto flex items-center gap-2 h-11 px-3 rounded-2xl border border-hairline bg-card/85 backdrop-blur-xl shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4),var(--shadow-md)] relative overflow-hidden">
          {/* Electric blue signal seam */}
          <span className="pointer-events-none absolute inset-x-6 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" aria-hidden />
          {/* Bottom horizon glow for contrast */}
          <span className="pointer-events-none absolute inset-x-10 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" aria-hidden />

          {/* Left: Brand + active-deal status */}
          <Link to="/" className="flex items-center gap-2 pr-2 border-r border-hairline/70 shrink-0 min-w-0 group">
            <img src={dabellaLogo} alt="DaBella" className="h-6 w-auto drop-shadow-[0_0_6px_rgba(37,99,235,0.35)]" />
            <div className="hidden sm:flex items-center gap-1.5 leading-none min-w-0">
              <span className="text-[13px] font-display font-extrabold text-white tracking-tight whitespace-nowrap">
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
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Idle</span>
                </span>
              )}
            </div>
          </Link>

          {/* Center: clustered nav */}
          <nav className="hidden md:flex flex-1 items-center justify-center px-1 overflow-hidden">
            <NavCluster items={SELL_CLUSTER} label="Sell" />
            <ClusterDivider />
            <NavCluster items={INSIGHTS_CLUSTER} label="Insights" />
            <ClusterDivider />
            <NavCluster items={opsCluster} label="Operations" />
          </nav>

          {/* Right: Utility cluster */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-hairline/70 shrink-0">
            <div className="hidden 2xl:flex items-center gap-1.5">
              <OwnerScopeFilter />
              <PublishStatusBadge />
            </div>

            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="md:hidden rounded-xl bg-muted/50 border border-hairline p-2 hover:bg-muted transition-colors pressable"
                  aria-label="Open navigation"
                >
                  <Menu className="h-4 w-4 text-white" />
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
                  <MobileClusterLabel>Sell</MobileClusterLabel>
                  {SELL_CLUSTER.map((item) => (
                    <MobileNavItem key={item.to} {...item} onNavigate={() => setMobileOpen(false)} />
                  ))}
                  <MobileClusterLabel>Insights</MobileClusterLabel>
                  {INSIGHTS_CLUSTER.map((item) => (
                    <MobileNavItem key={item.to} {...item} onNavigate={() => setMobileOpen(false)} />
                  ))}
                  <MobileClusterLabel>Operations</MobileClusterLabel>
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
                  onClick={toggle}
                  className="rounded-xl p-2 text-slate-300 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/5 transition-all pressable"
                  aria-label="Toggle dark mode"
                >
                  {dark ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[11px]">Theme</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="h-8 w-8 rounded-full text-[11px] font-bold flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity gradient-brand pressable shadow-[0_0_0_2px_hsl(var(--card)),0_0_14px_-2px_hsl(var(--primary)/0.5)]"
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
                  <Briefcase className="h-4 w-4 mr-2" /> My deals
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/manual")}>
                  <BookOpen className="h-4 w-4 mr-2" /> How to use this app
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
