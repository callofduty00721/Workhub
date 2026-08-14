import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/shared/FileUpload";
import { DOCUMENT_CATEGORIES, type FormValues } from "./schema";
import { Hint, Button, RemoveRowButton } from "./formFields";

export function Step5Documents() {
  const { register, control, formState: { errors } } = useFormContext<FormValues>();
  const documentsArray = useFieldArray({ control, name: "documents" });

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="website">Website (optional)</Label>
        <Hint>Your startup's official website, if you have one.</Hint>
        <Input id="website" placeholder="https://yourwebsite.com" {...register("website")} />
      </div>
      <div className="space-y-2">
        <Label>Social Links (optional)</Label>
        <Hint>Links to your startup's social media profiles.</Hint>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="LinkedIn URL" {...register("socialLinkedin")} />
          <Input placeholder="Twitter / X URL" {...register("socialTwitter")} />
          <Input placeholder="Facebook URL" {...register("socialFacebook")} />
          <Input placeholder="Instagram URL" {...register("socialInstagram")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Pitch Deck (optional)</Label>
        <Hint>Your investor presentation deck, if you have one ready.</Hint>
        <Controller control={control} name="pitchDeckUrl" render={({ field }) => (
          <FileUpload folder="pitch_deck" accept="application/pdf,.ppt,.pptx" value={field.value} onUploaded={(url) => field.onChange(url)} label="Upload pitch deck (PDF, PPT)" />
        )} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Documents</Label>
            <Hint>Supporting files — licenses, certificates, reports and more.</Hint>
          </div>
          <Button onClick={() => documentsArray.append({ name: "", description: "", url: "", category: "Other", fileSize: "" })}>Add Document</Button>
        </div>
        {documentsArray.fields.map((field, index) => (
          <div key={field.id} className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
            <Input placeholder="Document name (e.g. FSSAI License)" {...register(`documents.${index}.name` as const)} />
            <Controller control={control} name={`documents.${index}.category` as const} render={({ field: f }) => (
              <Select value={f.value} onValueChange={f.onChange}>
                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {DOCUMENT_CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            )} />
            <Input placeholder="Short description (optional)" className="sm:col-span-2" {...register(`documents.${index}.description` as const)} />
            <div className="sm:col-span-2">
              <Controller control={control} name={`documents.${index}.url` as const} render={({ field: f }) => (
                <FileUpload folder="document" value={f.value} onUploaded={(url) => f.onChange(url)} label="Upload document (PDF, DOC, XLS...)" accept="*" />
              )} />
            </div>
            {errors.documents?.[index]?.url && <p className="text-xs text-danger sm:col-span-2">{errors.documents[index]?.url?.message}</p>}
            <RemoveRowButton onClick={() => documentsArray.remove(index)} />
          </div>
        ))}
      </div>
    </>
  );
}
