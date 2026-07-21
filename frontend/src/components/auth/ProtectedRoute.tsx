import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children, allow }: { children: ReactNode; allow?: UserRole[] }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
