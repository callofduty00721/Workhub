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
import { publicSettingsApi } from "@/api/settings";
import { cn, initialsFromName, formatCurrency } from "@/lib/utils";
import { dashboardPathForRole, publicProfilePathForRole } from "@/lib/roles";

export const BASE_NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Freelancers", to: "/freelancers" },
  { label: "Influencers", to: "/influencers" },
  { label: "Startups", to: "/startups" },
];

// Secondary/niche discovery pages — folded into the "Explore" dropdown
// instead of the main bar so the primary nav stays to 5 links. "Community"
// was dropped entirely (its route is a ComingSoon stub, not a real page).
export const EXPLORE_LINKS = [
  { label: "Investors", to: "/investors" },
  { label: "Mentors", to: "/mentors" },
  { label: "Partners", to: "/partners" },
  { label: "Pricing", to: "/pricing" },
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

  // Public, not-admin-gated read of the Jobs kill-switch (Platform Settings
  // -> "Jobs Feature") — same flag drives the /jobs, /jobs/:id routes in
  // App.tsx, so the nav link only ever appears when those actually work.
  const { data: jobsEnabled } = useQuery({
    queryKey: ["settings", "jobs-enabled"],
    queryFn: publicSettingsApi.jobsEnabled,
    staleTime: 60 * 1000,
  });
  const navLinks = jobsEnabled ? [...BASE_NAV_LINKS, { label: "Jobs", to: "/jobs" }] : BASE_NAV_LINKS;

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
    <header className="sticky top-3 z-50 mx-auto w-[calc(100%-2rem)] max-w-6xl rounded-2xl border border-white/[0.08] bg-black/95 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      <div className="container relative flex h-14 items-center justify-between gap-4">
        <Logo />

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-white/[0.06] text-white" : "text-white/70 hover:text-white"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white/70 outline-none transition-colors hover:text-white">
              Explore <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="border-white/10 bg-neutral-900 text-white">
              {EXPLORE_LINKS.map((link) => (
                <DropdownMenuItem
                  key={link.to}
                  onClick={() => navigate(link.to)}
                  className="focus:bg-white/10 focus:text-white"
                >
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
                  placeholder="Search GrowHive..."
                  className="h-9 w-56 border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-[#65d838]"
                />
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setQuery(""); }}
                  className="ml-1 rounded-md p-2 text-white/50 hover:text-white"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className="text-white/70 hover:bg-white/10 hover:text-white"
              >
                <Search className="h-4.5 w-4.5" />
              </Button>
            )}

            {user ? (
              <>
                {user.role === "freelancer" && wallet && (
                  <Link
                    to="/dashboard/freelancer/earnings"
                    className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    <Wallet className="h-3.5 w-3.5 text-[#65d838]" />
                    {formatCurrency(wallet.wallet.availableBalance)}
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Messages"
                  asChild
                  className="text-white/70 hover:bg-white/10 hover:text-white"
                >
                  <Link to="/dashboard/messages">
                    <MessageSquare className="h-4.5 w-4.5" />
                  </Link>
                </Button>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="ml-1 flex items-center gap-2 rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#65d838]">
                      <Avatar className="h-9 w-9 border border-white/15">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{initialsFromName(user.name)}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 border-white/10 bg-neutral-900 text-white">
                    <DropdownMenuLabel>
                      <p className="truncate font-semibold text-white">{user.name}</p>
                      <p className="truncate text-xs font-normal capitalize text-white/50">
                        {user.role ? user.role.replace("_", " ") : "No role picked yet"}
                      </p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <RoleSwitcher />
                    <DropdownMenuItem
                      onClick={() => navigate(dashboardPathForRole(user.role))}
                      className="focus:bg-white/10 focus:text-white"
                    >
                      Dashboard
                    </DropdownMenuItem>
                    {publicProfilePathForRole(user.role, user.id) && (
                      <DropdownMenuItem
                        onClick={() => navigate(publicProfilePathForRole(user.role, user.id)!)}
                        className="focus:bg-white/10 focus:text-white"
                      >
                        My Profile
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => navigate("/settings")}
                      className="focus:bg-white/10 focus:text-white"
                    >
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-400 focus:bg-white/10 focus:text-red-400"
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  asChild
                  className="rounded-full border-white/20 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="rounded-full bg-gradient-to-b from-[#E8FF25] to-[#22C55E] px-5 font-semibold text-black transition-all hover:brightness-110"
                >
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>

          {!hideMobileToggle && (
            <button
              className="rounded-md p-2 text-white lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>

      {!hideMobileToggle && open && (
        <div className="border-t border-white/10 bg-black px-6 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-base font-medium text-white/80 hover:bg-white/10"
              >
                {link.label}
              </NavLink>
            ))}
            <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-white/40">
              Explore
            </p>
            {EXPLORE_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-base font-medium text-white/80 hover:bg-white/10"
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
            {user ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate(dashboardPathForRole(user.role))}
                  className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={handleLogout} className="text-white/70 hover:bg-white/10 hover:text-white">
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  asChild
                  className="rounded-full border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  className="rounded-full bg-gradient-to-b from-[#E8FF25] to-[#22C55E] px-5 font-semibold text-black transition-all hover:brightness-110"
                >
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
