import type { ReactNode } from "react";
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
    <div className="grid h-dvh lg:grid-cols-2">
      <div className="relative flex flex-col overflow-y-auto overflow-x-hidden px-6 py-8 sm:px-12 lg:px-16">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-24 -top-24 h-[320px] w-[320px] rounded-full bg-brand/10 blur-[100px]" />
          <div className="absolute bottom-0 right-0 h-[280px] w-[280px] rounded-full bg-violet-400/10 blur-[100px]" />
        </div>
        {/* margin-auto centers vertically when it fits; once content is taller
            than the viewport the auto margins collapse to 0, so it aligns to
            the top and scrolls instead of clipping the logo above the fold. */}
        <div className="m-auto w-full">
          <Logo className="mb-6" variant="light" />
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mx-auto w-full max-w-md">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-5 rounded-[24px] border border-border bg-card p-5 shadow-card sm:p-6">{children}</div>
            <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>
          </motion.div>
        </div>
      </div>

      <div className="relative hidden overflow-y-auto overflow-x-hidden bg-gradient-to-br from-ink via-ink to-brand/20 lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-16 -top-16 h-[380px] w-[380px] rounded-full bg-brand/25 blur-[110px]" />
          <div className="absolute -bottom-20 left-10 h-[320px] w-[320px] rounded-full bg-violet-500/20 blur-[110px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(255,255,255,0.06)_1px,_transparent_0)] bg-[size:26px_26px]" />
        </div>
        <div className="relative space-y-8 text-ink-foreground">
          <h2 className="text-3xl font-bold leading-tight">
            Whatever you're building, the people who can help are already here.
          </h2>
          <div className="space-y-5">
            {[
              { icon: Sparkles, text: "Founders and investors message each other directly, no intro needed" },
              { icon: Users, text: "Freelancers and mentors get verified before they ever show up in a search" },
              { icon: ShieldCheck, text: "Every conversation stays on the platform, not lost in an email thread" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-foreground/10 backdrop-blur-sm">
                  <item.icon className="h-5 w-5 text-brand-light" />
                </span>
                <p className="text-sm text-ink-foreground/70">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
