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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import PublishStatusBadge from "@/components/PublishStatusBadge";
import OwnerScopeFilter from "@/components/OwnerScopeFilter";
import dabellaLogo from "@/assets/dabella-logo.png";

const PRIMARY_NAV = [
  { to: "/", label: "Engine", icon: Wrench, end: true },
  { to: "/deals", label: "Deals", icon: Briefcase, end: false },
  { to: "/pipeline", label: "Pipeline", icon: GitBranch, end: false },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: false },
  { to: "/ledger", label: "Ledger", icon: Wallet, end: false },
  { to: "/incidents", label: "Incidents", icon: ShieldAlert, end: false },
  { to: "/energy-lens", label: "Energy Lens", icon: SunIcon, end: false },
  { to: "/manage-up", label: "Manage Up", icon: Trophy, end: false },
] as const;

type NavItemProps = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end: boolean;
};

function NavItem({ to, label, icon: Icon, end }: NavItemProps) {
  const prefetch = usePrefetchOnHover(to);
  return (
    <NavLink
      to={to}
      end={end}
      {...prefetch}
      title={label}
      className={({ isActive }) =>
        `group flex items-center gap-1.5 px-2 xl:px-2.5 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all pressable ${
          isActive
            ? "bg-primary/10 text-primary font-semibold"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-primary" : ""}`} />
          <span className="hidden xl:inline">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function MobileNavItem({ to, label, icon: Icon, end, onNavigate }: NavItemProps & { onNavigate: () => void }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all pressable ${
          isActive
            ? "bg-primary/10 text-primary border border-primary/20"
            : "text-foreground hover:bg-muted border border-transparent"
        }`
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
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

  const navItems = [
    ...PRIMARY_NAV,
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: ShieldCheck, end: false } as const] : []),
  ];

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
    <header className="sticky top-0 z-40 px-3 sm:px-4 lg:px-6 pt-3 pb-2 bg-gradient-to-b from-background via-background/95 to-background/0">
      <div className="max-w-7xl mx-auto flex items-center gap-3 h-14 px-3 rounded-2xl border border-hairline bg-card/80 backdrop-blur-xl shadow-[var(--shadow-md)]">
        {/* Left: Brand + active-deal status */}
        <Link to="/" className="flex items-center gap-3 pr-3 lg:pr-4 border-r border-hairline shrink-0 min-w-0 group">
          <div className="relative shrink-0">
            <div className="absolute -inset-1 rounded-xl gradient-brand opacity-0 group-hover:opacity-40 blur-md transition-opacity duration-300" />
            <img src={dabellaLogo} alt="DaBella" className="relative h-7 w-auto" />
          </div>
          <div className="hidden sm:flex flex-col leading-none min-w-0">
            <span className="text-[14px] font-display font-extrabold text-foreground tracking-tight whitespace-nowrap truncate">
              Close <span className="gradient-text">Engine</span>
            </span>
            <div className="flex items-center gap-1.5 mt-1 min-w-0">
              {activeDeal ? (
                <>
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-75 animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
                  </span>
                  <span className="text-[10px] font-semibold text-primary uppercase tracking-wider truncate">
                    {homeownerLabel}
                  </span>
                </>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    No active deal
                  </span>
                </>
              )}
            </div>
          </div>
        </Link>

        {/* Center: Primary navigation (desktop / tablet) */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-0.5 px-2 overflow-hidden">
          {navItems.slice(0, 8).map(({ to, label, icon: Icon, end }) => (
            <NavItem key={to} to={to} label={label} icon={Icon} end={end} />
          ))}
          {isAdmin && (
            <>
              <span className="hidden lg:inline-block h-4 w-px bg-hairline mx-1" />
              <NavItem
                to="/admin"
                label="Admin"
                icon={ShieldCheck}
                end={false}
              />
            </>
          )}
        </nav>

        {/* Right: Utility cluster */}
        <div className="flex items-center gap-2 pl-2 lg:pl-3 lg:border-l lg:border-hairline shrink-0">
          <div className="hidden lg:flex items-center gap-2">
            <OwnerScopeFilter />
            <PublishStatusBadge />
          </div>

          {/* Mobile nav trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="md:hidden rounded-xl bg-muted/60 border border-hairline p-2 hover:bg-muted transition-colors pressable"
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4 text-foreground" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-4">
              <div className="flex items-center gap-3 mb-6 pt-1">
                <img src={dabellaLogo} alt="DaBella" className="h-8 w-auto" />
                <h2 className="font-display font-extrabold text-lg">
                  Close <span className="gradient-text">Engine</span>
                </h2>
              </div>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <MobileNavItem key={item.to} {...item} onNavigate={() => setMobileOpen(false)} />
                ))}
              </nav>
              <div className="mt-6 pt-4 border-t border-hairline space-y-2">
                <OwnerScopeFilter />
                <PublishStatusBadge />
              </div>
            </SheetContent>
          </Sheet>

          <button
            onClick={toggle}
            className="rounded-xl p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors pressable"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4" />}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-9 w-9 rounded-full text-xs font-bold flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity gradient-brand pressable shadow-[var(--shadow-glow)] border-2 border-card"
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
  );
}
