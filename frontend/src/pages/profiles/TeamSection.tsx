import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { companyApi } from "@/api/companies";
import { initialsFromName } from "@/lib/utils";

// Shared by Agency and Talent Partner profile pages' "Team" tab — reuses the
// existing Company model (company.controller.js's getPublicCompany) rather
// than inventing a separate "team" concept for these two roles.
export function TeamSection({ companyId }: { companyId?: string }) {
  const { data: company } = useQuery({
    queryKey: ["companies", companyId, "public"],
    queryFn: () => companyApi.getPublic(companyId!),
    enabled: !!companyId,
  });

  if (!companyId || !company?.members.length) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
          <Users className="h-4 w-4" /> Team
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {company.members.map((m, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={m.avatar} alt={m.name} />
                <AvatarFallback className="bg-neutral-900 text-xs text-white">{initialsFromName(m.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{m.name}</p>
                {m.headline && <p className="truncate text-xs text-muted-foreground">{m.headline}</p>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
