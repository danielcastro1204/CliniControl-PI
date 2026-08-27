import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/integrations/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Power, UserCog, Stethoscope, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import DentistManagement from "./DentistManagement";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";

interface UserRow {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  identification: string | null;
  phone: string | null;
  username: string | null;
  is_active: boolean;
  role: string;
  email: string;
}

export default function UserList() {
  const { role, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const canManageUsers = role === "admin" || role === "system_admin";
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", identification: "", phone: "" });
  const [saving, setSaving] = useState(false);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserRow | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles, error } = await api.from("profiles").select("*").execute();
    if (error) { console.error(error); setLoading(false); return; }
    if (!profiles) { setLoading(false); return; }

    const userIds = profiles.map((p: any) => p.user_id);
    const { data: roles } = await api.from("user_roles").select("user_id, role").in("user_id", userIds).execute();

    const roleMap: Record<string, string> = {};
    roles?.forEach((r: any) => { roleMap[r.user_id] = r.role; });

    const userRows: UserRow[] = profiles.map((p: any) => ({
      id: p.id, user_id: p.user_id, first_name: p.first_name, last_name: p.last_name,
      identification: p.identification, phone: p.phone, username: p.username,
      is_active: p.is_active, role: roleMap[p.user_id] || "clinico", email: p.username || "",
    }));

    setUsers(userRows);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleActive = async (profile: UserRow) => {
    const { error } = await api.from("profiles").update({ is_active: !profile.is_active }).eq("id", profile.id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: profile.is_active ? "Usuario desactivado" : "Usuario activado" });
      fetchUsers();
    }
  };

  const openEdit = (u: UserRow) => {
    setEditingUser(u);
    setEditForm({
      first_name: u.first_name,
      last_name: u.last_name,
      identification: u.identification || "",
      phone: u.phone || "",
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editForm.first_name || !editForm.last_name) {
      toast({ variant: "destructive", title: "Error", description: "Nombre y apellido son obligatorios" });
      return;
    }
    setSaving(true);
    const { error } = await api.from("profiles").update({
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      identification: editForm.identification || null,
      phone: editForm.phone || null,
    }).eq("id", editingUser.id);
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Usuario actualizado" });
      setEditDialogOpen(false);
      fetchUsers();
    }
  };

  const openDelete = (u: UserRow) => {
    setDeletingUser(u);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    const { error } = await api.from("profiles").delete().eq("id", deletingUser.id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Usuario eliminado" });
      fetchUsers();
    }
    setDeleteDialogOpen(false);
    setDeletingUser(null);
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search || `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()) || (u.identification || "").includes(search);
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchStatus = filterStatus === "all" || (filterStatus === "active" && u.is_active) || (filterStatus === "inactive" && !u.is_active);
    return matchSearch && matchRole && matchStatus;
  });

  if (!canManageUsers) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No tienes permisos para acceder a este módulo.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary font-display">Gestión de Usuarios</h1>
        <p className="text-sm text-muted-foreground">Usuarios y odontólogos del consultorio</p>
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="usuarios" className="gap-2">
            <UserCog className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="odontologos" className="gap-2">
            <Stethoscope className="h-4 w-4" />
            Odontólogos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => navigate("/dashboard/usuarios/nuevo")}>
                <Plus className="mr-2 h-4 w-4" /> Crear usuario clínico
              </Button>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar por nombre o identificación..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Rol" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los roles</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="clinico">Clínico</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Activos</SelectItem>
                      <SelectItem value="inactive">Inactivos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Apellido</TableHead>
                      <TableHead className="hidden md:table-cell">Identificación</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead className="hidden sm:table-cell">Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
                    ) : filtered.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No se encontraron usuarios</TableCell></TableRow>
                    ) : (
                      filtered.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.first_name}</TableCell>
                          <TableCell>{u.last_name}</TableCell>
                          <TableCell className="hidden md:table-cell">{u.identification || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                              {u.role === "admin" ? "Administrador" : "Clínico"}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant={u.is_active ? "outline" : "destructive"}>
                              {u.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(u)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title={u.is_active ? "Desactivar" : "Activar"} onClick={() => toggleActive(u)}>
                                <Power className={`h-4 w-4 ${u.is_active ? "text-green-600" : "text-destructive"}`} />
                              </Button>
                              {u.id !== profile?.id && u.role !== "admin" && (
                                <Button variant="ghost" size="icon" title="Eliminar" onClick={() => openDelete(u)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Edit User Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Editar Usuario</DialogTitle>
                  <DialogDescription>Modifica los datos del usuario</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre *</Label>
                      <Input value={editForm.first_name} onChange={(e) => setEditForm(f => ({ ...f, first_name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Apellido *</Label>
                      <Input value={editForm.last_name} onChange={(e) => setEditForm(f => ({ ...f, last_name: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Identificación</Label>
                      <Input value={editForm.identification} onChange={(e) => setEditForm(f => ({ ...f, identification: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar cambios"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Delete User Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminará permanentemente a <strong>{deletingUser?.first_name} {deletingUser?.last_name}</strong> y su cuenta de acceso. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>

        <TabsContent value="odontologos">
          <DentistManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
