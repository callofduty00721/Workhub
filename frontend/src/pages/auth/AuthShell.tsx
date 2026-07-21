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
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <Link to="/" className="mb-10">
          <Logo />
        </Link>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mx-auto w-full max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </motion.div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-dark via-slate-900 to-primary/20 lg:flex lg:flex-col lg:justify-center lg:px-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--primary)/0.25),_transparent_65%)]" />
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
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
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
