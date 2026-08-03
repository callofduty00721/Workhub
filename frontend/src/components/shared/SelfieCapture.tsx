import { useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadApi, type UploadFolder } from "@/api/uploads";

// Live webcam capture for face verification — sits alongside FileUpload as a
// second way to provide the same kind of image, since some users won't have
// (or won't want to grant) camera access. Captures a single JPEG frame,
// uploads it through the same /uploads endpoint FileUpload uses, and hands
// back the resulting URL exactly like FileUpload's onUploaded does.
export function SelfieCapture({ folder, onCaptured }: { folder: UploadFolder; onCaptured: (url: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraOpen(false);
  };

  useEffect(() => stopCamera, []);

  const openCamera = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera capture isn't supported in this browser — upload a photo instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setIsCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
    } catch {
      setError("Couldn't access your camera — check browser permissions, or upload a photo instead.");
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      async (blob) => {
        if (!blob) return;
        stopCamera();
        setIsUploading(true);
        setError(null);
        try {
          const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
          const result = await uploadApi.upload(file, folder);
          onCaptured(result.url);
        } catch {
          setError("Upload failed — try again.");
        } finally {
          setIsUploading(false);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  if (isUploading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading selfie...
      </div>
    );
  }

  if (isCameraOpen) {
    return (
      <div className="space-y-2">
        <video ref={videoRef} autoPlay playsInline muted className="h-56 w-full max-w-xs rounded-lg border border-border bg-black object-cover" />
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="gradient" onClick={capture}>
            <Camera className="h-3.5 w-3.5" /> Capture
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={stopCamera}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Button type="button" size="sm" variant="outline" onClick={openCamera}>
        <Camera className="h-3.5 w-3.5" /> Take Selfie
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
