import { useState, useEffect } from "react";
import { api } from "@/integrations/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Power, Pencil, Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tipoDocumentoOptions } from "@/types/patient";

interface DentistRow {
  id: string;
  first_name: string;
  last_name_1: string;
  last_name_2: string;
  identification: string;
  cod_prestador: string;
  tipo_documento: string;
  is_active: boolean;
}

const emptyForm = {
  first_name: "",
  last_name_1: "",
  last_name_2: "",
  identification: "",
  cod_prestador: "",
  tipo_documento: "CC",
};

export default function DentistManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [dentists, setDentists] = useState<DentistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingDentist, setDeletingDentist] = useState<DentistRow | null>(null);

  const fetchDentists = async () => {
    setLoading(true);
    const { data, error } = await api
      .from("dentists")
      .select("*")
      .order("first_name");
    if (error) {
      console.error(error);
    } else {
      setDentists((data as DentistRow[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDentists();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (d: DentistRow) => {
    setEditingId(d.id);
    setForm({
      first_name: d.first_name,
      last_name_1: d.last_name_1,
      last_name_2: d.last_name_2,
      identification: d.identification,
      cod_prestador: d.cod_prestador,
      tipo_documento: d.tipo_documento || "CC",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Backend enforces all validation (required fields, identification format, duplicates)
    if (!profile?.clinic_id) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo determinar el consultorio" });
      return;
    }

    setSaving(true);

    const payload = {
      first_name: form.first_name,
      last_name_1: form.last_name_1,
      last_name_2: form.last_name_2,
      identification: form.identification,
      cod_prestador: form.cod_prestador,
      tipo_documento: form.tipo_documento,
    };

    if (editingId) {
      const { error } = await api
        .from("dentists")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
      } else {
        toast({ title: "Odontólogo actualizado" });
        setDialogOpen(false);
        fetchDentists();
      }
    } else {
      const { error } = await api
        .from("dentists")
        .insert({ ...payload, clinic_id: profile.clinic_id });

      if (error) {
        toast({ variant: "destructive", title: "Error", description: error.message });
      } else {
        toast({ title: "Odontólogo registrado" });
        setDialogOpen(false);
        fetchDentists();
      }
    }

    setSaving(false);
  };

  const openDelete = (d: DentistRow) => {
    setDeletingDentist(d);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingDentist) return;
    const { error } = await api.from("dentists").delete().eq("id", deletingDentist.id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Odontólogo eliminado" });
      fetchDentists();
    }
    setDeleteDialogOpen(false);
    setDeletingDentist(null);
  };

  const toggleActive = async (d: DentistRow) => {
    const { error } = await api
      .from("dentists")
      .update({ is_active: !d.is_active })
      .eq("id", d.id);

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: d.is_active ? "Odontólogo desactivado" : "Odontólogo activado" });
      fetchDentists();
    }
  };

  const filtered = dentists.filter((d) => {
    if (!search) return true;
    const full = `${d.first_name} ${d.last_name_1} ${d.last_name_2} ${d.identification}`.toLowerCase();
    return full.includes(search.toLowerCase());
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const tipoDocLabel = (val: string) => tipoDocumentoOptions.find(o => o.value === val)?.label?.split(" - ")[0] || val;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-secondary font-display">Odontólogos</h2>
          <p className="text-sm text-muted-foreground">Odontólogos registrados en el consultorio</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Registrar odontólogo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Odontólogo" : "Registrar Odontólogo"}</DialogTitle>
              <DialogDescription>{editingId ? "Modifica los datos del odontólogo" : "Ingresa los datos del nuevo odontólogo"}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre(s) *</Label>
                  <Input value={form.first_name} onChange={set("first_name")} placeholder="Ej: María" />
                </div>
                <div className="space-y-2">
                  <Label>Apellido 1 *</Label>
                  <Input value={form.last_name_1} onChange={set("last_name_1")} placeholder="Ej: López" />
                </div>
                <div className="space-y-2">
                  <Label>Apellido 2</Label>
                  <Input value={form.last_name_2} onChange={set("last_name_2")} placeholder="Ej: García" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de documento *</Label>
                  <Select value={form.tipo_documento} onValueChange={(v) => setForm(f => ({ ...f, tipo_documento: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoDocumentoOptions.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Número de identificación *</Label>
                  <Input value={form.identification} onChange={set("identification")} placeholder="Ej: 1020304050" />
                </div>
                <div className="space-y-2">
                  <Label>Código del prestador *</Label>
                  <Input value={form.cod_prestador} onChange={set("cod_prestador")} placeholder="Ej: 110010101301" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Registrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o identificación..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Apellido 1</TableHead>
                <TableHead className="hidden md:table-cell">Tipo Doc.</TableHead>
                <TableHead className="hidden md:table-cell">Identificación</TableHead>
                <TableHead className="hidden lg:table-cell">Cód. Prestador</TableHead>
                <TableHead className="hidden sm:table-cell">Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron odontólogos
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.first_name}</TableCell>
                    <TableCell>{d.last_name_1} {d.last_name_2}</TableCell>
                    <TableCell className="hidden md:table-cell">{tipoDocLabel(d.tipo_documento)}</TableCell>
                    <TableCell className="hidden md:table-cell">{d.identification}</TableCell>
                    <TableCell className="hidden lg:table-cell">{d.cod_prestador}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={d.is_active ? "outline" : "destructive"}>
                        {d.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(d)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title={d.is_active ? "Desactivar" : "Activar"}
                          onClick={() => toggleActive(d)}
                        >
                          <Power className={`h-4 w-4 ${d.is_active ? "text-green-600" : "text-destructive"}`} />
                        </Button>
                        <Button variant="ghost" size="icon" title="Eliminar" onClick={() => openDelete(d)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar odontólogo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente a <strong>{deletingDentist?.first_name} {deletingDentist?.last_name_1}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
