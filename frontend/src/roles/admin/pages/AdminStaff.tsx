import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { Plus, Loader2, Ban, RotateCcw } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { adminApi } from "@/api/admin";
import { ADMIN_PERMISSION_VALUES, ADMIN_PERMISSION_LABELS } from "@/types";
import type { AdminPermission, User } from "@/types";

const gridVariants = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

function PermissionCheckboxes({ selected, onChange }: { selected: AdminPermission[]; onChange: (next: AdminPermission[]) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {ADMIN_PERMISSION_VALUES.map((p) => (
        <label key={p} className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={selected.includes(p)}
            onCheckedChange={(checked) => onChange(checked === true ? [...selected, p] : selected.filter((x) => x !== p))}
          />
          {ADMIN_PERMISSION_LABELS[p]}
        </label>
      ))}
    </div>
  );
}

function CreateStaffDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);

  const mutation = useMutation({
    mutationFn: () => adminApi.createStaff({ name, email, password, permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      onOpenChange(false);
      setName("");
      setEmail("");
      setPassword("");
      setPermissions([]);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a staff account</DialogTitle>
          <DialogDescription>They'll log in with this email/password and see only the sections you check below.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <div className="space-y-1.5">
            <Label>Permissions</Label>
            <PermissionCheckboxes selected={permissions} onChange={setPermissions} />
          </div>
          {mutation.isError && (
            <p className="text-xs text-danger">
              {isAxiosError(mutation.error) ? mutation.error.response?.data?.message : "Something went wrong."}
            </p>
          )}
          <Button
            className="w-full"
            variant="gradient"
            disabled={!name.trim() || !email.trim() || password.length < 8 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Staff Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EditPermissionsDialog({ staff, onOpenChange }: { staff: User | null; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [permissions, setPermissions] = useState<AdminPermission[]>(staff?.staffPermissions ?? []);

  const mutation = useMutation({
    mutationFn: () => adminApi.updateStaffPermissions(staff!.id, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "staff"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog
      open={!!staff}
      onOpenChange={(open) => {
        if (!open) onOpenChange(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit permissions — {staff?.name}</DialogTitle>
          <DialogDescription>Changes apply immediately — the next request they make is checked against this list.</DialogDescription>
        </DialogHeader>
        <PermissionCheckboxes selected={permissions} onChange={setPermissions} />
        {mutation.isError && (
          <p className="mt-2 text-xs text-danger">
            {isAxiosError(mutation.error) ? mutation.error.response?.data?.message : "Something went wrong."}
          </p>
        )}
        <Button className="mt-2 w-full" variant="gradient" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Permissions
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminStaff() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const { data: staff, isLoading } = useQuery({ queryKey: ["admin", "staff"], queryFn: adminApi.staff });

  const toggleBanMutation = useMutation({
    mutationFn: (staffId: string) => adminApi.toggleBan(staffId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "staff"] }),
  });

  return (
    <DashboardLayout
      role="super_admin"
      title="Staff"
      subtitle="Give a hired team member access to just the admin sections they need to handle — everything else (withdrawals, payment disputes, settings, plans, users) stays yours alone."
      actions={
        <Button variant="gradient" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      }
    >
      <Card className="divide-y divide-border">
        {isLoading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !staff?.length ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <p className="text-sm font-medium">No staff accounts yet</p>
            <p className="text-sm text-muted-foreground">Add one to delegate specific admin sections without giving full access.</p>
          </div>
        ) : (
          <motion.div variants={gridVariants} initial="hidden" animate="show" className="divide-y divide-border">
          {staff.map((s) => (
            <motion.div key={s.id} variants={rowVariants} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="flex items-center gap-2 font-medium">
                  {s.name}
                  {s.isBanned && (
                    <Badge variant="outline" className="border-danger/40 text-danger">
                      Banned
                    </Badge>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{s.email}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {s.staffPermissions?.length ? (
                    s.staffPermissions.map((p) => (
                      <Badge key={p} variant="outline" className="text-[11px]">
                        {ADMIN_PERMISSION_LABELS[p]}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No permissions granted yet</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(s)}>
                  Edit Permissions
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={s.isBanned ? "text-success hover:bg-success/10" : "text-danger hover:bg-danger/10"}
                  disabled={toggleBanMutation.isPending}
                  onClick={() => toggleBanMutation.mutate(s.id)}
                >
                  {s.isBanned ? <RotateCcw className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                  {s.isBanned ? "Unban" : "Ban"}
                </Button>
              </div>
            </motion.div>
          ))}
          </motion.div>
        )}
      </Card>

      <CreateStaffDialog open={creating} onOpenChange={setCreating} />
      <EditPermissionsDialog staff={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </DashboardLayout>
  );
}
