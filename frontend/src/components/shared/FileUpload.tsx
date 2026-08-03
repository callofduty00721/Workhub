import { useRef, useState } from "react";
import { isAxiosError } from "axios";
import { UploadCloud, Loader2, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadApi, type UploadFolder } from "@/api/uploads";
import { cn } from "@/lib/utils";

export function FileUpload({
  folder,
  accept = "image/png,image/jpeg,image/webp",
  label = "Click to upload or drag & drop",
  value,
  onUploaded,
  className,
  validate,
}: {
  folder: UploadFolder;
  accept?: string;
  label?: string;
  value?: string;
  onUploaded: (url: string, fileName: string) => void;
  className?: string;
  // Runs client-side before the file is uploaded — return an error string to
  // block the upload (e.g. video too long), or null/undefined to proceed.
  validate?: (file: File) => Promise<string | null | undefined>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only preview as an image when every accepted type is an image — avoids
  // trying to render a video/PDF/mixed-accept (e.g. KYC docs) value as <img>.
  const isImageOnly = accept.split(",").every((type) => type.trim().startsWith("image/"));
  const showImagePreview = isImageOnly && !!value && !isUploading;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (validate) {
      const validationError = await validate(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    setIsUploading(true);
    try {
      const result = await uploadApi.upload(file, folder);
      onUploaded(result.url, result.name);
    } catch (err) {
      setError(isAxiosError(err) ? err.response?.data?.message || "Upload failed" : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={className}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-dashed border-border px-4 py-8 text-center transition-colors hover:border-primary/50 hover:bg-accent/50",
          value && "border-success/40 bg-success/5"
        )}
      >
        {showImagePreview && (
          <>
            <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUploaded("", "");
              }}
              className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-danger/10 hover:text-danger"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        <div
          className={cn(
            "relative flex flex-col items-center gap-2",
            showImagePreview && "rounded-md bg-background/85 px-3 py-2 backdrop-blur-sm"
          )}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          ) : value ? (
            <CheckCircle2 className="h-6 w-6 text-success" />
          ) : (
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
          )}
          <p className="text-sm text-muted-foreground">{isUploading ? "Uploading..." : value ? "File uploaded — click to replace" : label}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      {value && !showImagePreview && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2 text-xs">
          <span className="truncate text-muted-foreground">{value}</span>
          <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => onUploaded("", "")}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  );
}
