import { Navigate, Outlet } from "react-router-dom";
import AccessDenied from "@/components/auth/AccessDenied";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/dashboard/AppSidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function Dashboard() {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <main className="flex-1 overflow-auto p-4 md:p-6 bg-muted/20">
            {role ? (
              <Outlet />
            ) : (
              <AccessDenied
                title="No pudimos cargar tu consultorio"
                description="Tu sesión está activa, pero todavía no fue posible resolver tus permisos del consultorio."
              />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
