import { Link } from "react-router-dom";
import { Rocket, Users, Briefcase, Trophy, ShieldCheck, MessageSquare, Tag } from "lucide-react";

const PILLARS = [
  {
    icon: Rocket,
    title: "Startups",
    desc: "Founders list real startups — stage, funding progress, and open roles — and connect directly with investors, mentors, and hires.",
    to: "/startups",
  },
  {
    icon: Users,
    title: "Freelancers",
    desc: "Verified freelancers offer skills across design, development, marketing, and more — browsable by category and sub-category.",
    to: "/freelancers",
  },
  {
    icon: Briefcase,
    title: "Jobs & Projects",
    desc: "Employers post full-time roles and one-off/contract projects; candidates apply or bid directly — no middleman.",
    to: "/jobs",
  },
  {
    icon: Trophy,
    title: "Contests",
    desc: "Clients run design and content contests with real prizes, picking winners from real submitted entries.",
    to: "/contests",
  },
];

const PRINCIPLES = [
  { icon: ShieldCheck, title: "Verified profiles", desc: "Identity, KYC, and role verification are built into the platform, not bolted on." },
  { icon: MessageSquare, title: "Direct messaging", desc: "Every connection — hiring, mentoring, investing — happens through direct conversation, not a black-box algorithm." },
  { icon: Tag, title: "Transparent rates", desc: "Rates, budgets, and prize amounts are shown upfront. No hidden fees, no bidding-war games." },
];

export default function About() {
  return (
    <div>
      <section className="border-b bg-gradient-to-b from-primary/5 via-white to-white">
        <div className="container py-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            About MahaHub
          </span>
          <h1 className="mx-auto mt-6 max-w-2xl text-3xl font-black tracking-tight text-neutral-900 sm:text-4xl">
            Empowering India&apos;s multi-state talent ecosystem
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-7 text-neutral-500">
            MahaHub connects founders, freelancers, investors, mentors, and job seekers on one platform — real people, real work, real
            connections.
          </p>
        </div>
      </section>

      <section className="container py-14">
        <h2 className="text-center text-2xl font-bold tracking-tight text-neutral-900">What you'll find here</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <Link
              key={p.title}
              to={p.to}
              className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_16px_32px_-12px_rgba(0,0,0,0.16)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <p.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-base font-bold text-neutral-900">{p.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">{p.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t bg-neutral-50">
        <div className="container py-14">
          <h2 className="text-center text-2xl font-bold tracking-tight text-neutral-900">How we build it</h2>
          <div className="mx-auto mt-8 grid max-w-4xl gap-6 sm:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="rounded-2xl border border-neutral-200 bg-white p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-bold text-neutral-900">{p.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container py-14 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Have a question?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">We'd love to hear from you.</p>
        <Link
          to="/contact"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          Contact Us
        </Link>
      </section>

      {/* Flaticon Free License requires this credit to appear somewhere on
          the site wherever those icons are used — kept here rather than next
          to every icon. Add one line per distinct Flaticon author used. */}
      <section className="border-t border-neutral-100 py-6 text-center text-xs text-neutral-400">
        <p>
          Icons made by{" "}
          <a href="https://www.flaticon.com/authors/magnific" title="Magnific" className="underline hover:text-neutral-600">
            Magnific
          </a>{" "}
          from{" "}
          <a href="https://www.flaticon.com/" title="Flaticon" className="underline hover:text-neutral-600">
            www.flaticon.com
          </a>
        </p>
      </section>
    </div>
  );
}
