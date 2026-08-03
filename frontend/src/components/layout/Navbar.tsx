import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Menu, X, Search, MessageSquare, Wallet, ChevronDown } from "lucide-react";
import { Logo } from "./Logo";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { RoleSwitcher } from "@/components/shared/RoleSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { paymentApi } from "@/api/payments";
import { cn, initialsFromName, formatCurrency } from "@/lib/utils";
import { dashboardPathForRole, publicProfilePathForRole } from "@/lib/roles";

export const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Startups", to: "/startups" },
  { label: "Freelancers", to: "/freelancers" },
  { label: "Jobs", to: "/jobs" },
  { label: "Pricing", to: "/pricing" },
];

// Secondary/niche discovery pages — folded into the "Explore" dropdown
// instead of the main bar so the primary nav stays to 5 links. "Community"
// was dropped entirely (its route is a ComingSoon stub, not a real page).
export const EXPLORE_LINKS = [
  { label: "Investors", to: "/investors" },
  { label: "Mentors", to: "/mentors" },
  { label: "Partners", to: "/partners" },
  { label: "Influencers", to: "/influencers" },
];

// hideMobileToggle: for pages (like the Dashboard) that already provide their
// own mobile menu button — showing this one too would put two hamburger
// icons on screen at once, so the caller opts out and uses its own drawer
// (the dashboard sidebar) instead of this one.
export function Navbar({ hideMobileToggle = false }: { hideMobileToggle?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: wallet } = useQuery({
    queryKey: ["payments", "earnings", "wallet-chip"],
    queryFn: () => paymentApi.myEarnings({ page: 1, limit: 1 }),
    enabled: user?.role === "freelancer",
    staleTime: 60 * 1000,
  });

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-xl">
      <div className="container relative flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-4 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "text-primary"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground">
              Explore <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {EXPLORE_LINKS.map((link) => (
                <DropdownMenuItem key={link.to} onClick={() => navigate(link.to)}>
                  {link.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 md:flex">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={() => !query && setSearchOpen(false)}
                  placeholder="Search MahaHub..."
                  className="h-9 w-56"
                />
                <button type="button" onClick={() => { setSearchOpen(false); setQuery(""); }} className="ml-1 rounded-md p-2 text-muted-foreground hover:text-foreground" aria-label="Close search">
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setSearchOpen(true)}>
                <Search className="h-4.5 w-4.5" />
              </Button>
            )}

            {user ? (
              <>
                {user.role === "freelancer" && wallet && (
                  <Link
                    to="/dashboard/freelancer/earnings"
                    className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
                  >
                    <Wallet className="h-3.5 w-3.5 text-primary" />
                    {formatCurrency(wallet.wallet.availableBalance)}
                  </Link>
                )}
                <Button variant="ghost" size="icon" aria-label="Messages" asChild>
                  <Link to="/dashboard/messages">
                    <MessageSquare className="h-4.5 w-4.5" />
                  </Link>
                </Button>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="ml-1 flex items-center gap-2 rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{initialsFromName(user.name)}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <p className="truncate font-semibold text-foreground">{user.name}</p>
                      <p className="truncate text-xs font-normal capitalize text-muted-foreground">
                        {user.role ? user.role.replace("_", " ") : "No role picked yet"}
                      </p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <RoleSwitcher />
                    <DropdownMenuItem onClick={() => navigate(dashboardPathForRole(user.role))}>Dashboard</DropdownMenuItem>
                    {publicProfilePathForRole(user.role, user.id) && (
                      <DropdownMenuItem onClick={() => navigate(publicProfilePathForRole(user.role, user.id)!)}>My Profile</DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate("/settings")}>Settings</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-danger focus:text-danger">
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button variant="gradient" asChild>
                  <Link to="/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {!hideMobileToggle && (
            <button
              className="rounded-md p-2 text-foreground lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {!hideMobileToggle && open && (
        <div className="border-t border-border bg-background px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-accent"
              >
                {link.label}
              </NavLink>
            ))}
            <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Explore</p>
            {EXPLORE_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80 hover:bg-accent"
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
            {user ? (
              <>
                <Button variant="outline" onClick={() => navigate(dashboardPathForRole(user.role))}>
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={handleLogout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/login">Log In</Link>
                </Button>
                <Button variant="gradient" asChild>
                  <Link to="/register">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
