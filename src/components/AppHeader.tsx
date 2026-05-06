import { Link, NavLink, useNavigate } from "react-router-dom";
import { Moon, Sun, LayoutDashboard, Briefcase, Wrench, LogOut, GitBranch } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import { useDeal } from "@/hooks/useDeals";
import { useDarkMode } from "@/hooks/useDarkMode";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import dabellaLogo from "@/assets/dabella-logo.png";

const NAV = [
  { to: "/", label: "Engine", icon: Wrench, end: true },
  { to: "/deals", label: "Deals", icon: Briefcase, end: false },
  { to: "/pipeline", label: "Pipeline", icon: GitBranch, end: false },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: false },
] as const;

export default function AppHeader() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { activeDealId, setActiveDealId } = useActiveDeal();
  const { data: activeDeal } = useDeal(activeDealId);
  const { dark, toggle } = useDarkMode();

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

  return (
    <header className="sticky top-0 z-40 glass border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 min-w-0 group">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-xl gradient-brand opacity-0 group-hover:opacity-30 blur-md transition-opacity" />
            <img src={dabellaLogo} alt="DaBella" className="relative h-8 w-auto" />
          </div>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div className="hidden sm:block min-w-0">
            <h1 className="text-base font-display font-extrabold text-foreground tracking-tight leading-none truncate">
              Close <span className="gradient-text">Engine</span>
            </h1>
            {activeDeal && (
              <p className="text-[11px] text-primary font-semibold mt-0.5 truncate flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                {activeDeal.homeowner1 || "Untitled"}
                {activeDeal.homeowner2 ? ` & ${activeDeal.homeowner2}` : ""}
              </p>
            )}
          </div>
        </Link>

        <nav className="flex items-center gap-1 p-1 rounded-xl bg-muted/40 border border-border/60">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/60"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="rounded-xl bg-muted/60 border border-border p-2 hover:bg-muted transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? (
              <Sun className="h-4 w-4 text-warning" />
            ) : (
              <Moon className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-9 w-9 rounded-full text-xs font-bold flex items-center justify-center text-primary-foreground hover:opacity-90 transition-opacity gradient-brand"
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
