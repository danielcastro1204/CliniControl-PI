import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import RoleGuard from "@/components/auth/RoleGuard";

// Route-level code splitting: each page (and the heavy libraries only it needs,
// e.g. jspdf/jspdf-autotable in reports, the municipalities/attention catalogs
// in patient & attention forms) is now its own chunk, fetched on demand
// instead of bloating the initial bundle.
import Index from "./pages/Index";
const NotFound = lazy(() => import("./pages/NotFound"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const InventoryList = lazy(() => import("./pages/inventory/InventoryList"));
const InventoryForm = lazy(() => import("./pages/inventory/InventoryForm"));
const InventoryDetail = lazy(() => import("./pages/inventory/InventoryDetail"));
const InventoryReports = lazy(() => import("./pages/reports/InventoryReports"));
const RipsGeneration = lazy(() => import("./pages/rips/RipsGeneration"));
const PatientList = lazy(() => import("./pages/patients/PatientList"));
const PatientForm = lazy(() => import("./pages/patients/PatientForm"));
const PatientDetail = lazy(() => import("./pages/patients/PatientDetail"));
const AttentionForm = lazy(() => import("./pages/attentions/AttentionForm"));
const UserList = lazy(() => import("./pages/users/UserList"));
const UserForm = lazy(() => import("./pages/users/UserForm"));

const queryClient = new QueryClient();

function RouteFallback() {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<Navigate to="inventario" replace />} />
              <Route path="inventario" element={<InventoryList />} />
              <Route path="inventario/nuevo" element={<InventoryForm />} />
              <Route path="inventario/:id" element={<InventoryDetail />} />
              <Route path="inventario/:id/editar" element={<InventoryForm />} />
              <Route path="pacientes" element={<PatientList />} />
              <Route path="pacientes/nuevo" element={<PatientForm />} />
              <Route path="pacientes/:id" element={<PatientDetail />} />
              <Route path="pacientes/:id/editar" element={<PatientForm />} />
              <Route path="pacientes/:patientId/atencion/nueva" element={<AttentionForm />} />
              <Route
                element={
                  <RoleGuard
                    allowedRoles={["admin", "system_admin"]}
                    description="Solo los administradores del consultorio pueden acceder a RIPS, reportes y gestión de usuarios."
                  />
                }
              >
                <Route path="rips" element={<RipsGeneration />} />
                <Route path="reportes" element={<InventoryReports />} />
                <Route path="usuarios" element={<UserList />} />
                <Route path="usuarios/nuevo" element={<UserForm />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
