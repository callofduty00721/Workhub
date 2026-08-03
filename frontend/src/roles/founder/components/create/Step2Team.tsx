import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OPEN_ROLE_TYPES, WORK_MODES, type FormValues } from "./schema";
import { Hint, Button, RemoveRowButton } from "./formFields";

export function Step2Team() {
  const { register, control } = useFormContext<FormValues>();
  const teamArray = useFieldArray({ control, name: "team" });
  const openRolesArray = useFieldArray({ control, name: "openRoles" });

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Team Members</Label>
            <Hint>The people currently working on the startup.</Hint>
          </div>
          <Button onClick={() => teamArray.append({ name: "", role: "", bio: "", linkedin: "", skills: "", joinedDate: "" })}>Add Member</Button>
        </div>
        {teamArray.fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 rounded-lg border border-[#e2e8f0] p-4 sm:grid-cols-2">
            <Input placeholder="Full name" {...register(`team.${index}.name` as const)} />
            <Input placeholder="Role (e.g. CTO)" {...register(`team.${index}.role` as const)} />
            <Input placeholder="LinkedIn URL" className="sm:col-span-2" {...register(`team.${index}.linkedin` as const)} />
            <Textarea placeholder="Short bio" className="min-h-[70px] sm:col-span-2" {...register(`team.${index}.bio` as const)} />
            <Input placeholder="Skills / expertise (comma separated)" {...register(`team.${index}.skills` as const)} />
            <Input type="date" {...register(`team.${index}.joinedDate` as const)} />
            {teamArray.fields.length > 1 && <RemoveRowButton onClick={() => teamArray.remove(index)} />}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Open Roles (Looking for Team)</Label>
            <Hint>Roles you're actively hiring or looking for volunteers/co-founders for.</Hint>
          </div>
          <Button
            onClick={() =>
              openRolesArray.append({
                title: "",
                type: "full_time",
                workMode: "on_site",
                description: "",
                requiredSkills: "",
                requiredExperience: "",
                salary: "",
                responsibilitiesText: "",
              })
            }
          >
            Add Role
          </Button>
        </div>
        {openRolesArray.fields.length === 0 && <p className="text-[12.5px] text-[#94a3b8]">No open roles yet — add roles you're hiring for.</p>}
        {openRolesArray.fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 rounded-lg border border-[#e2e8f0] p-4 sm:grid-cols-2">
            <Input placeholder="Role title (e.g. Marketing Lead)" {...register(`openRoles.${index}.title` as const)} />
            <div className="grid grid-cols-2 gap-3">
              <Controller control={control} name={`openRoles.${index}.type` as const} render={({ field: f }) => (
                <Select value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    {OPEN_ROLE_TYPES.map((t) => (<SelectItem key={t} value={t}>{t === "full_time" ? "Full Time" : "Part Time"}</SelectItem>))}
                  </SelectContent>
                </Select>
              )} />
              <Controller control={control} name={`openRoles.${index}.workMode` as const} render={({ field: f }) => (
                <Select value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger><SelectValue placeholder="Work mode" /></SelectTrigger>
                  <SelectContent>
                    {WORK_MODES.map((m) => (<SelectItem key={m} value={m} className="capitalize">{m.replace("_", " ")}</SelectItem>))}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <Textarea placeholder="Role description" className="min-h-[60px] sm:col-span-2" {...register(`openRoles.${index}.description` as const)} />
            <Input
              placeholder="Required skills (comma separated, e.g. React, Figma, SEO)"
              className="sm:col-span-2"
              {...register(`openRoles.${index}.requiredSkills` as const)}
            />
            <Input placeholder="Required experience (e.g. 2+ years)" {...register(`openRoles.${index}.requiredExperience` as const)} />
            <Input placeholder="Salary (e.g. ₹25,000 - ₹35,000/month, or Equity only)" {...register(`openRoles.${index}.salary` as const)} />
            <Textarea
              placeholder={"What work will need to be done? One per line, e.g.\nRun paid ad campaigns\nWrite weekly content calendar"}
              className="min-h-[80px] sm:col-span-2"
              {...register(`openRoles.${index}.responsibilitiesText` as const)}
            />
            <RemoveRowButton onClick={() => openRolesArray.remove(index)} />
          </div>
        ))}
      </div>
    </>
  );
}
