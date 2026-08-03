import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// Self-contained month grid — no charting/calendar library needed for
// something this small. `markedDates` are YYYY-MM-DD keys (see toDateKey)
// for days that should show a dot, e.g. days with a task due.
export function MiniCalendar({
  month,
  onMonthChange,
  markedDates,
  selectedDate,
  onSelectDate,
}: {
  month: Date;
  onMonthChange: (month: Date) => void;
  markedDates: Set<string>;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const today = new Date();

  const cells: (Date | null)[] = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, monthIndex, i + 1)),
  ];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">{month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((d, i) => (
          <span key={i} className="text-[10px] font-medium text-muted-foreground">
            {d}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={i} />;
          const isToday = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const hasTasks = markedDates.has(toDateKey(date));
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                "relative flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors",
                isSelected ? "bg-primary text-primary-foreground font-semibold" : isToday ? "font-semibold text-primary" : "text-foreground hover:bg-accent"
              )}
            >
              {date.getDate()}
              {hasTasks && !isSelected && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
