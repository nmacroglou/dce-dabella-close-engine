import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Moon, Sun, LayoutDashboard, Briefcase, Wrench, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveDeal } from "@/contexts/ActiveDealContext";
import { useDeal } from "@/hooks/useDeals";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import dabellaLogo from "@/assets/dabella-logo.png";

export default function AppHeader() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { activeDealId, setActiveDealId } = useActiveDeal();
  const { data: activeDeal } = useDeal(activeDealId);

  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handleSignOut = async () => {
    setActiveDealId(null);
    await signOut();
    navigate("/auth");
  };

  const initials = (user?.user_metadata?.full_name || user?.email || "?")
    .split(" ").map((s: string) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="bg-card border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <img src={dabellaLogo} alt="DaBella" className="h-8 w-auto flex-shrink-0" />
          <div className="h-6 w-px bg-border hidden sm:block" />
          <div className="hidden sm:block min-w-0">
            <h1 className="text-base font-display font-extrabold text-foreground tracking-tight leading-none truncate">
              Close Engine
            </h1>
            {activeDeal && (
              <p className="text-[11px] text-primary font-semibold mt-0.5 truncate">
                Working: {activeDeal.homeowner1 || "Untitled"}
                {activeDeal.homeowner2 ? ` & ${activeDeal.homeowner2}` : ""}
              </p>
            )}
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className="px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Engine</span>
          </Link>
          <Link
            to="/deals"
            className="px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Deals</span>
          </Link>
          <Link
            to="/dashboard"
            className="px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold text-foreground hover:bg-muted transition-colors flex items-center gap-1.5"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDark(!dark)}
            className="rounded-xl bg-muted border border-border p-2 hover:bg-muted/80 transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun className="h-4 w-4 text-warning" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="h-9 w-9 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center hover:bg-primary/20 transition-colors"
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
