import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Eye, Pencil, Trash2, ArrowUpDown, Filter, ClipboardPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getAllPatients, removePatient, type Patient } from "@/store/patientStore";
import {
  getTipoDocLabel, getTipoUsuarioLabel, getSexoLabel,
  tipoUsuarioOptions, codSexoOptions,
} from "@/types/patient";
import { Skeleton } from "@/components/ui/skeleton";

type SortField = "nombre" | "documento" | "fechaNacimiento";
type SortDir = "asc" | "desc";

export default function PatientList() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tipoUsuarioFilter, setTipoUsuarioFilter] = useState("");
  const [sexoFilter, setSexoFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [sortField, setSortField] = useState<SortField>("nombre");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const fetchPatients = async () => {
    try {
      const data = await getAllPatients();
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const filtered = useMemo(() => {
    return patients
      .filter(p => {
        const q = search.toLowerCase();
        const fullName = `${p.nombres} ${p.primerApellido} ${p.segundoApellido}`.toLowerCase();
        const matchSearch = !q ||
          p.numDocumentoIdentificacion.includes(q) ||
          fullName.includes(q);
        const matchTipo = !tipoUsuarioFilter || p.tipoUsuario === tipoUsuarioFilter;
        const matchSexo = !sexoFilter || p.codSexo === sexoFilter;
        const matchEstado = !estadoFilter || p.estadoTratamiento === estadoFilter;
        return matchSearch && matchTipo && matchSexo && matchEstado;
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        switch (sortField) {
          case "nombre": return dir * `${a.primerApellido} ${a.nombres}`.localeCompare(`${b.primerApellido} ${b.nombres}`);
          case "documento": return dir * a.numDocumentoIdentificacion.localeCompare(b.numDocumentoIdentificacion);
          case "fechaNacimiento": return dir * a.fechaNacimiento.localeCompare(b.fechaNacimiento);
          default: return 0;
        }
      });
  }, [patients, search, tipoUsuarioFilter, sexoFilter, estadoFilter, sortField, sortDir]);

  const handleDelete = async (id: string) => {
    try {
      await removePatient(id);
      setPatients(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const hasActiveFilters = tipoUsuarioFilter || sexoFilter || estadoFilter;
  const clearFilters = () => { setTipoUsuarioFilter(""); setSexoFilter(""); setEstadoFilter(""); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary font-display">Registro de Pacientes</h1>
          <p className="text-sm text-muted-foreground">Gestiona los pacientes de tu consultorio</p>
        </div>
        <Button onClick={() => navigate("/dashboard/pacientes/nuevo")} className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar paciente
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o documento..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={tipoUsuarioFilter || "__all__"} onValueChange={(v) => setTipoUsuarioFilter(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder="Tipo de usuario" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {tipoUsuarioOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sexoFilter || "__all__"} onValueChange={(v) => setSexoFilter(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Sexo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {codSexoOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={estadoFilter || "__all__"} onValueChange={(v) => setEstadoFilter(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-[170px] h-8 text-xs"><SelectValue placeholder="Estado tratamiento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            <SelectItem value="en_tratamiento">En tratamiento</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>Limpiar filtros</Button>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("nombre")}>
                <span className="inline-flex items-center gap-1">Nombre <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead>Tipo Doc.</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("documento")}>
                <span className="inline-flex items-center gap-1">Nº Documento <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead>Tipo Usuario</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {patients.length === 0 ? "No hay pacientes registrados. Comienza agregando uno." : "No se encontraron resultados para tu búsqueda."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(patient => (
                <TableRow key={patient.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/dashboard/pacientes/${patient.id}`)}>
                  <TableCell className="font-medium">{patient.primerApellido} {patient.segundoApellido}, {patient.nombres}</TableCell>
                  <TableCell className="text-xs font-medium">{getTipoDocLabel(patient.tipoDocumentoIdentificacion).split(" - ")[0]}</TableCell>
                  <TableCell className="font-medium">{patient.numDocumentoIdentificacion}</TableCell>
                  <TableCell className="text-xs">{getTipoUsuarioLabel(patient.tipoUsuario)}</TableCell>
                  <TableCell>{getSexoLabel(patient.codSexo).split(" - ")[0]}</TableCell>
                  <TableCell>
                    <Badge variant={patient.estadoTratamiento === "en_tratamiento" ? "default" : "secondary"}>
                      {patient.estadoTratamiento === "en_tratamiento" ? "En tratamiento" : "Finalizado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/pacientes/${patient.id}/atencion/nueva`)} title="Añadir atención">
                        <ClipboardPlus className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/pacientes/${patient.id}`)} title="Ver">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/pacientes/${patient.id}/editar`)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar paciente?</AlertDialogTitle>
                            <AlertDialogDescription>Se eliminará el paciente {patient.nombres} {patient.primerApellido} permanentemente.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(patient.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
