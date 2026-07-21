import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Rocket,
  Users,
  Briefcase,
  Handshake,
  Heart,
  Search,
  Star,
  ShieldCheck,
  TrendingUp,
  Code2,
  Smartphone,
  Palette,
  Megaphone,
  Brain,
  BarChart3,
  Video,
  MoreHorizontal,
  MapPin,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  INDUSTRIES,
  CATEGORY_GRID,
  FEATURED_STARTUPS_FALLBACK,
  HOME_STATS,
  LATEST_JOBS_PREVIEW,
  TOP_FREELANCERS_PREVIEW,
  TOP_PEOPLE_PREVIEW,
} from "@/lib/mockData";
import { initialsFromName } from "@/lib/utils";

const STAT_ICONS = { rocket: Rocket, users: Users, briefcase: Briefcase, handshake: Handshake, heart: Heart };
const CATEGORY_ICONS = {
  code: Code2,
  smartphone: Smartphone,
  palette: Palette,
  megaphone: Megaphone,
  brain: Brain,
  "bar-chart": BarChart3,
  video: Video,
  more: MoreHorizontal,
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export default function Home() {
  return (
    <div>
      <HeroSection />
      <StatsSection />
      <CategoriesSection />
      <FeaturedStartupsSection />
      <DiscoverColumnsSection />
      <CtaSection />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.12),_transparent_60%)]" />
      <div className="container relative grid gap-12 py-20 lg:grid-cols-2 lg:py-28">
        <motion.div initial="hidden" animate="show" variants={stagger} className="flex flex-col justify-center">
          <motion.div variants={fadeUp}>
            <Badge variant="default" className="mb-5 w-fit gap-1.5 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Empowering India&apos;s Ecosystem
            </Badge>
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
            Where Startups Find Opportunities <span className="text-primary">&amp; Grow Together</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-5 max-w-xl text-lg text-muted-foreground">
            MahaHub is the all-in-one platform connecting startups, investors, mentors, freelancers, and job seekers to
            build the future together.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" variant="default" asChild>
              <Link to="/startups">
                Explore Startups <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/register">
                Join MahaHub <Rocket className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
          <motion.div variants={fadeUp} className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-3">
              {["Rohit", "Anjali", "Aman", "Priya"].map((name) => (
                <Avatar key={name} className="h-9 w-9 border-2 border-background">
                  <AvatarFallback className="text-[11px]">{initialsFromName(name)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">20,000+ Entrepreneurs</p>
              <p className="text-xs text-muted-foreground">Building the future together</p>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative flex items-center"
        >
          <Card className="w-full space-y-5 p-6 shadow-card">
            <h3 className="text-base font-semibold">Discover Amazing Startups</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search startups, founders, skills, domains..." className="pl-9" />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Popular Categories</p>
                <Link to="/startups" className="text-xs font-medium text-primary hover:underline">
                  View All
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.slice(0, 6).map((cat) => (
                  <Badge key={cat} variant="outline" className="cursor-pointer hover:bg-accent">
                    {cat}
                  </Badge>
                ))}
              </div>
            </div>

            <Link to="/startups" className="block rounded-lg border border-border p-4 transition-colors hover:bg-accent/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                    C
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold">CropAI</p>
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground">AI based Smart Farming Solution</p>
                  </div>
                </div>
                <span className="shrink-0 text-right text-xs">
                  <span className="block text-muted-foreground">Funding</span>
                  <span className="font-semibold text-success">₹2.5 Cr</span>
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["AgriTech", "AI", "Seed Stage"].map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
              <span className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                View Profile <ArrowRight className="h-3 w-3" />
              </span>
            </Link>
          </Card>

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="absolute -right-4 -top-6 hidden w-56 rounded-xl border border-border bg-card p-4 shadow-card sm:block"
          >
            <p className="text-xs text-muted-foreground">Funding Raised</p>
            <div className="mt-1 flex items-center justify-between">
              <p className="text-xl font-bold text-primary">₹120 Cr+</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-success">
                <TrendingUp className="h-4 w-4" />
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Across 800 Startups</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="border-y border-border bg-card/50">
      <div className="container grid grid-cols-2 gap-8 py-12 sm:grid-cols-3 lg:grid-cols-5">
        {HOME_STATS.map((stat) => {
          const Icon = STAT_ICONS[stat.icon];
          return (
            <div key={stat.label} className="flex flex-col items-center gap-3 text-center">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                <Icon className="h-5.5 w-5.5" />
              </span>
              <div>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CategoriesSection() {
  return (
    <section className="container py-16">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Explore Top Categories</h2>
        <Link to="/freelancers" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          View All Categories <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
        className="grid grid-cols-4 gap-4 sm:grid-cols-8"
      >
        {CATEGORY_GRID.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.icon];
          return (
            <motion.div key={cat.label} variants={fadeUp} className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-foreground/80 transition-colors hover:bg-primary/10 hover:text-primary">
                <Icon className="h-5.5 w-5.5" />
              </span>
              <p className="text-xs font-medium text-muted-foreground">{cat.label}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

function FeaturedStartupsSection() {
  return (
    <section className="bg-card/40 py-16">
      <div className="container">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Featured Startups</h2>
          <Link to="/startups" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View All Startups <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_STARTUPS_FALLBACK.map((s) => (
            <Card key={s._id} className="flex flex-col p-5 transition-shadow hover:shadow-card">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
                  {s.name[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold">{s.name}</p>
                    {s.verified && (
                      <Badge variant="success" className="gap-1 px-1.5 py-0 text-[10px]">
                        <ShieldCheck className="h-2.5 w-2.5" /> Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <p className="mb-4 line-clamp-2 flex-1 text-sm text-muted-foreground">{s.tagline}</p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {s.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                <span className="text-muted-foreground">Funding</span>
                <span className="font-semibold text-success">₹{s.fundingCr} Cr</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function DiscoverColumnsSection() {
  return (
    <section className="container py-16">
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Top Freelancers</h3>
            <Link to="/freelancers" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {TOP_FREELANCERS_PREVIEW.map((f) => (
              <div key={f.name} className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs">{initialsFromName(f.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{f.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{f.role}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="flex items-center gap-1 text-xs font-medium">
                    <Star className="h-3 w-3 fill-warning text-warning" /> {f.rating}
                    <span className="text-muted-foreground">({f.reviews})</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{f.rate}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Latest Jobs</h3>
            <Link to="/jobs" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {LATEST_JOBS_PREVIEW.map((job) => (
              <div key={job.title} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{job.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{job.company}</p>
                </div>
                <div className="shrink-0 text-right">
                  <Badge variant={job.type === "Remote" ? "default" : "outline"} className="text-[10px]">
                    {job.type === "Remote" ? <Wifi className="mr-1 h-2.5 w-2.5" /> : <MapPin className="mr-1 h-2.5 w-2.5" />}
                    {job.type === "Remote" ? job.type : job.location}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold">Top Investors &amp; Mentors</h3>
            <Link to="/investors" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-4">
            {TOP_PEOPLE_PREVIEW.map((p) => (
              <div key={p.name} className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs">{initialsFromName(p.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.role}</p>
                </div>
                <p className="flex shrink-0 items-center gap-1 text-xs font-medium">
                  <Star className="h-3 w-3 fill-warning text-warning" /> {p.rating}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="container py-16">
      <div className="relative overflow-hidden rounded-2xl bg-primary/5 px-8 py-12 sm:px-12">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-4">
            <span className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:flex">
              <Rocket className="h-7 w-7" />
            </span>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Ready to take your startup to the next level?</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                Join MahaHub today and connect with the right people, resources, and opportunities to grow faster.
              </p>
            </div>
          </div>
          <Button size="lg" variant="default" asChild className="shrink-0">
            <Link to="/register">
              Join MahaHub Now <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
