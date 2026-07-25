import { useMutation } from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { userApi } from "@/api/users";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function SaveButton({ type, id, className }: { type: "job" | "project" | "service"; id: string; className?: string }) {
  const { user, refreshUser } = useAuth();
  const isSaved =
    type === "job" ? user?.savedJobs?.includes(id) : type === "project" ? user?.savedProjects?.includes(id) : user?.savedServices?.includes(id);

  const mutation = useMutation({
    mutationFn: () =>
      type === "job" ? userApi.toggleSavedJob(id) : type === "project" ? userApi.toggleSavedProject(id) : userApi.toggleSavedService(id),
    onSuccess: () => refreshUser(),
  });

  if (!user || user.role !== "freelancer") return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        mutation.mutate();
      }}
      disabled={mutation.isPending}
      title={isSaved ? "Remove from saved" : "Save for later"}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80",
        className
      )}
    >
      <Bookmark className={cn("h-3.5 w-3.5", isSaved && "fill-current")} />
    </button>
  );
}
