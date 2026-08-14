import {useRef} from "react";
import {Link} from "react-router-dom";
import {motion, useScroll, useTransform, type MotionValue} from "framer-motion";
import {ArrowUpRight, Check, type LucideIcon} from "lucide-react";

export interface OverlapCardItem {
    icon: LucideIcon;
    tag: string;
    title: string;
    description: string;
    points: string[];
    href: string;
    ctaLabel?: string;
}

// Scroll distance (vh) dedicated to each card's own "arrival" handoff, plus
// one trailing segment so the last card gets to sit pinned alone for a beat
// before the whole stack releases.
const SEGMENT_VH = 70;
const TRAIL_SEGMENTS = 1;
// How far below its resting spot an arriving card starts, as a percentage of
// its OWN height (not a fixed px value) — this guarantees it sits fully
// below the fold of the pinned area regardless of viewport height or card
// size. A fixed px offset was too small on taller screens, letting
// not-yet-arrived cards (all clamped to this same offset before their own
// segment starts) peek into view, stacked behind the first card.
const ARRIVE_FROM = "140%";

// A vertical stack of cards where each one arrives by sliding up and
// covering the one before it — and then STAYS put. Earlier cards never
// scroll away once they've landed; they just sit pinned underneath whatever
// arrives next, right up until the very end of the stack.
//
// This uses a SINGLE `position: sticky` wrapper for the whole stack (not one
// per card), pinned for the entire scroll range of the section. All cards
// share one CSS grid cell (so they're literally stacked on top of each
// other), and Framer maps each card's own slice of the shared scroll
// progress to a slide-up-and-settle. `useTransform` clamps to the output's
// end value once progress moves past a card's own input range, so "arrived"
// means "stays arrived" — there's no per-card release to fix.
//
// Usage: <OverlapCardStack items={[{ icon, tag, title, description, points, href }]} />
export function OverlapCardStack({items}: {items: OverlapCardItem[]}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const {scrollYProgress} = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const segments = items.length + TRAIL_SEGMENTS;

    return (
        <div ref={containerRef} className="relative" style={{height: `${segments * SEGMENT_VH }vh`}}>
          <div
    className="sticky top-20  grid h-[calc(110vh-8rem)] place-items-center overflow-hidden px-6 lg:px-0"
>
                {items.map((item, i) => (
                    <StackedCard
                        key={item.tag}
                        item={item}
                        index={i}
                        total={items.length}
                        segments={segments}
                        scrollYProgress={scrollYProgress}
                    />
                ))}
            </div>
        </div>
    );
}

function StackedCard({
    item,
    index,
    total,
    segments,
    scrollYProgress,
}: {
    item: OverlapCardItem;
    index: number;
    total: number;
    segments: number;
    scrollYProgress: MotionValue<number>;
}) {
    const isFirst = index === 0;
    const isLast = index === total - 1;

    // Card 0 is already in place the moment the stack starts pinning; every
    // card after it owns the segment matching its own index, sliding up over
    // that window. It stays at full opacity throughout the slide — this needs
    // to be a clean cover, not a cross-fade, or the card underneath shows
    // through while it's mid-transition. Equal-value input ranges upset
    // useTransform's interpolator, so the "first card" case uses a full-width
    // range with a constant output instead of collapsing the range to a point.
    const arriveRange: [number, number] = isFirst ? [0, 1] : [(index - 1) / segments, index / segments];
    const y = useTransform(scrollYProgress, arriveRange, isFirst ? ["0%", "0%"] : [ARRIVE_FROM, "0%"]);

    // The card directly underneath the next arrival recedes slightly (scale +
    // dim) purely for depth — it does not move, it just reads as one layer
    // further back while the next card covers it. The last card has nothing
    // arriving on top of it, so it never recedes.
    const recedeRange: [number, number] = [index / segments, (index + 1) / segments];
    const scale = useTransform(scrollYProgress, recedeRange, isLast ? [1, 1] : [1, 0.95]);
    const dim = useTransform(scrollYProgress, recedeRange, isLast ? [1, 1] : [1, 0.85]);

    return (
        <motion.div style={{y, scale, zIndex: index + 1, gridArea: "1 / 1"}} className="mx-auto w-full max-w-5xl">
            <motion.div style={{opacity: dim}}>
                <Link
                    to={item.href}
                    className="group relative grid overflow-hidden rounded-[36px] border border-border bg-card shadow-[0_30px_70px_-25px_rgba(15,23,42,.35)] transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_60px_120px_-35px_rgba(15,23,42,.45)] hover:border-foreground/15 lg:grid-cols-2"
                >
                    {/* LEFT SIDE */}
                    <div className="relative z-10 flex flex-col justify-center p-6 md:p-9">
                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-foreground/80">
                            <item.icon className="h-3.5 w-3.5" />
                            {item.tag}
                        </span>

                        <h2 className="mt-5 text-3xl font-bold leading-tight text-foreground lg:text-4xl">
                            {item.title}
                        </h2>

                        <p className="mt-3 max-w-lg text-base leading-7 text-muted-foreground">{item.description}</p>

                        <div className="mt-6 space-y-3">
                            {item.points.map((point) => (
                                <div key={point} className="flex items-center gap-3">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success/10">
                                        <Check className="h-3.5 w-3.5 text-success" />
                                    </div>
                                    <span className="text-[14px] font-medium text-foreground/80">{point}</span>
                                </div>
                            ))}
                        </div>

                        <button className="mt-7 inline-flex w-fit items-center gap-3 rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-soft transition-all duration-300 group-hover:gap-5">
                            {item.ctaLabel ?? "Get Started"}
                            <ArrowUpRight size={18} />
                        </button>
                    </div>

                    {/* RIGHT SIDE — a simple icon on a quiet dark panel with a single
              orange glow, hidden below lg (it's decoration only; the LEFT SIDE
              carries all the real content). */}
                    <div
                        className="relative hidden items-center justify-center overflow-hidden lg:flex"
                        style={{
                            background:
                                "radial-gradient(circle at 75% 20%, rgba(250,131,46,0.35) 0%, transparent 45%), linear-gradient(135deg, #1c1c1e 0%, #2c2c2e 100%)",
                        }}
                    >
                        <motion.div
                            animate={{y: [0, -14, 0]}}
                            transition={{duration: 4, repeat: Infinity, ease: "easeIn"}}
                            className="flex h-32 w-32 items-center justify-center rounded-[32px] border border-white/10 bg-white/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)] backdrop-blur-xl"
                        >
                            <item.icon className="h-12 w-12 text-white" />
                        </motion.div>
                    </div>
                </Link>
            </motion.div>
        </motion.div>
    );
}
