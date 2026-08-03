import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from "@/components/layout/Logo";
import { ShieldCheck, Sparkles, Users } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative flex flex-col justify-center overflow-hidden px-6 py-12 sm:px-12 lg:px-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 -top-24 h-[320px] w-[320px] rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-[280px] w-[280px] rounded-full bg-violet-400/10 blur-[100px]" />
        </div>
        <Link to="/" className="mb-10">
          <Logo />
        </Link>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mx-auto w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
          <p className="mt-1.5 text-sm text-neutral-500">{subtitle}</p>
          <div className="mt-8 rounded-[24px] border border-neutral-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-7">{children}</div>
          <div className="mt-6 text-center text-sm text-neutral-500">{footer}</div>
        </motion.div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-900 to-primary/25 lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-16 h-[380px] w-[380px] rounded-full bg-primary/25 blur-[110px]" />
          <div className="absolute -bottom-20 left-10 h-[320px] w-[320px] rounded-full bg-violet-500/20 blur-[110px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.06)_1px,_transparent_0)] bg-[size:26px_26px]" />
        </div>
        <div className="relative space-y-8 text-white">
          <h2 className="text-3xl font-bold leading-tight">
            Build something great with the people who can help you get there.
          </h2>
          <div className="space-y-5">
            {[
              { icon: Sparkles, text: "Get discovered by 2,500+ active investors" },
              { icon: Users, text: "Connect with 8,000+ vetted freelancers & mentors" },
              { icon: ShieldCheck, text: "Verified profiles and secure messaging" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                  <item.icon className="h-5 w-5" />
                </span>
                <p className="text-sm text-slate-200">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
