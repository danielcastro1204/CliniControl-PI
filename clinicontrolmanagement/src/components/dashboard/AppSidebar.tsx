import { Package, Users, FileText, UserCog, BarChart3, LoaderCircle, ShieldAlert } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface Module {
  title: string;
  url: string;
  icon: any;
  roles: AppRole[];
}

const modules: Module[] = [
  { title: "Inventario clínico", url: "/dashboard/inventario", icon: Package, roles: ["admin", "clinico", "system_admin"] },
  { title: "Pacientes y Atenciones", url: "/dashboard/pacientes", icon: Users, roles: ["admin", "clinico", "system_admin"] },
  { title: "Generación de RIPS", url: "/dashboard/rips", icon: FileText, roles: ["admin", "system_admin"] },
  { title: "Reportes", url: "/dashboard/reportes", icon: BarChart3, roles: ["admin", "system_admin"] },
  { title: "Gestión de Usuarios", url: "/dashboard/usuarios", icon: UserCog, roles: ["admin", "system_admin"] },
];

export default function AppSidebar() {
  const { state } = useSidebar();
  const { role, loading } = useAuth();
  const collapsed = state === "collapsed";

  const visibleModules = modules.filter((m) => {
    if (!role) return false;
    return m.roles.includes(role);
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleModules.length > 0 ? (
                visibleModules.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="hover:bg-accent"
                        activeClassName="bg-accent text-accent-foreground font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled className="opacity-80">
                    {loading ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldAlert className="mr-2 h-4 w-4" />
                    )}
                    {!collapsed && (
                      <span>
                        {loading ? "Cargando módulos..." : "No se pudo cargar la navegación"}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
