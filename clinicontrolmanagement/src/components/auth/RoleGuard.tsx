import { Navigate, Outlet } from "react-router-dom";
import AccessDenied from "@/components/auth/AccessDenied";
import { AppRole, useAuth } from "@/contexts/AuthContext";

interface RoleGuardProps {
  allowedRoles: AppRole[];
  description?: string;
}

export default function RoleGuard({ allowedRoles, description }: RoleGuardProps) {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!role) {
    return (
      <AccessDenied
        title="No pudimos cargar tus permisos"
        description="Tu sesión inició correctamente, pero no fue posible identificar tu rol dentro del consultorio."
      />
    );
  }

  if (!allowedRoles.includes(role)) {
    return <AccessDenied description={description} />;
  }

  return <Outlet />;
}