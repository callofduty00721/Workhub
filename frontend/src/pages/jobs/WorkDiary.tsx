import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Plus, Trash2, CreditCard, Loader2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { timeEntryApi } from "@/api/timeEntries";
import { paymentApi } from "@/api/payments";
import { payWithRazorpay } from "@/lib/razorpay";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";

export function WorkDiary({
  applicationId,
  hourlyRate,
  freelancerName = "",
  viewerRole,
}: {
  applicationId: string;
  hourlyRate: number;
  freelancerName?: string;
  viewerRole: "client" | "freelancer";
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState(0);
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["time-entries", applicationId],
    queryFn: () => timeEntryApi.list(applicationId),
  });

  const addMutation = useMutation({
    mutationFn: () => timeEntryApi.add(applicationId, { date, hours, description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries", applicationId] });
      setAdding(false);
      setHours(0);
      setDescription("");
    },
    onError: (err) => setError(isAxiosError(err) ? err.response?.data?.message || "Failed to log hours" : "Something went wrong"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => timeEntryApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["time-entries", applicationId] }),
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      await payWithRazorpay({
        createOrder: () => paymentApi.createHourlyPayment(applicationId, [...selected]),
        verify: (payload) => paymentApi.verifyMarketplacePayment(payload),
        description: `Hourly payment to ${freelancerName}`,
        prefill: { name: user!.name, email: user!.email },
        onSuccess: () => {
          setSelected(new Set());
          queryClient.invalidateQueries({ queryKey: ["time-entries", applicationId] });
          queryClient.invalidateQueries({ queryKey: ["payments", "mine"] });
        },
      });
    },
    onError: (err) => setError(isAxiosError(err) ? err.response?.data?.message || "Payment failed" : "Payment gateway unavailable"),
  });

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (isLoading) return null;

  const unbilled = entries?.filter((e) => !e.billed) ?? [];
  const billed = entries?.filter((e) => e.billed) ?? [];
  const selectedHours = unbilled.filter((e) => selected.has(e._id)).reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Clock className="h-3 w-3" /> Work Diary {hourlyRate > 0 && `(${formatCurrency(hourlyRate)}/hr)`}
        </span>
        {viewerRole === "freelancer" && !adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-xs font-medium text-primary hover:underline">
            <Plus className="mr-0.5 inline h-3 w-3" /> Log hours
          </button>
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      {adding && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} className="h-8 text-xs" />
            <Input
              type="number"
              min={0.25}
              step={0.25}
              max={24}
              placeholder="Hours"
              value={hours || ""}
              onChange={(e) => setHours(Number(e.target.value))}
              className="h-8 text-xs"
            />
          </div>
          <Input placeholder="What did you work on?" value={description} onChange={(e) => setDescription(e.target.value)} className="h-8 text-xs" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button variant="gradient" size="sm" className="h-7 text-[11px]" disabled={!hours || addMutation.isPending} onClick={() => addMutation.mutate()}>
              {addMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />} Save
            </Button>
          </div>
        </div>
      )}

      {!entries?.length ? (
        <p className="text-xs text-muted-foreground">No hours logged yet.</p>
      ) : (
        <>
          <div className="space-y-1.5">
            {unbilled.map((e) => (
              <div key={e._id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2 text-xs">
                <div className="flex items-center gap-2">
                  {viewerRole === "client" && (
                    <input type="checkbox" checked={selected.has(e._id)} onChange={() => toggleSelected(e._id)} className="h-3.5 w-3.5" />
                  )}
                  <div>
                    <p className="font-medium">
                      {new Date(e.date).toLocaleDateString()} · {e.hours}h
                    </p>
                    {e.description && <p className="text-muted-foreground">{e.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    Unbilled
                  </Badge>
                  {viewerRole === "freelancer" && (
                    <button type="button" onClick={() => deleteMutation.mutate(e._id)}>
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {billed.map((e) => (
              <div key={e._id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2 text-xs opacity-70">
                <div>
                  <p className="font-medium">
                    {new Date(e.date).toLocaleDateString()} · {e.hours}h
                  </p>
                  {e.description && <p className="text-muted-foreground">{e.description}</p>}
                </div>
                <Badge variant="success" className="text-[10px]">
                  Paid
                </Badge>
              </div>
            ))}
          </div>
          {viewerRole === "client" && unbilled.length > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-2.5 text-xs">
              <span>
                {selectedHours}h selected — {formatCurrency(selectedHours * hourlyRate)}
              </span>
              <Button
                variant="gradient"
                size="sm"
                className="h-7 text-[11px]"
                disabled={selected.size === 0 || payMutation.isPending}
                onClick={() => payMutation.mutate()}
              >
                {payMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />} Pay Selected
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
