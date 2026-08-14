import { Info, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Small "before you submit" tips card — dropped near the top of posting/edit
// forms so first-time users know what makes a good listing before they start
// typing, rather than finding out after a rejection or low engagement.
export function FormGuidelines({ title = "Guidelines", tips }: { title?: string; tips: string[] }) {
  return (
    <Card className="border-brand/20 bg-brand/5 shadow-none">
      <CardContent className="p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Info className="h-4 w-4 text-brand" /> {title}
        </h4>
        <ul className="mt-2.5 space-y-1.5">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" /> {tip}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
