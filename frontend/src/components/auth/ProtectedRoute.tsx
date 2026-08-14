import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole, AdminPermission } from "@/types";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({
  children,
  allow,
  permission,
}: {
  children: ReactNode;
  allow?: UserRole[];
  // For admin-panel routes a "staff" account can be scoped into — a
  // super_admin in `allow` always passes regardless. This is UX only; the
  // real boundary is requirePermission on the backend (see middleware/auth.js) —
  // this just avoids showing a staff account a blank/broken page for a
  // section it has no permission for.
  permission?: AdminPermission;
}) {
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

  if (allow && (!user.role || !allow.includes(user.role))) {
    return <Navigate to="/" replace />;
  }

  if (permission && user.role === "staff" && !user.staffPermissions?.includes(permission)) {
    return <Navigate to="/dashboard/admin" replace />;
  }

  return <>{children}</>;
}
