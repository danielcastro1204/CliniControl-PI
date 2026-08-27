import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { DateInput } from "@/components/ui/date-input";
import { useToast } from "@/hooks/use-toast";
import { addPatient, updatePatient, getPatientById } from "@/store/patientStore";
import { useAuth } from "@/contexts/AuthContext";
import {
  tipoDocumentoOptions, tipoUsuarioOptions, codSexoOptions,
  zonaTerritorialOptions, incapacidadOptions, paisOptions, municipioOptions,
} from "@/types/patient";

interface FormData {
  nombres: string;
  primerApellido: string;
  segundoApellido: string;
  estadoTratamiento: "en_tratamiento" | "finalizado";
  tipoDocumentoIdentificacion: string;
  numDocumentoIdentificacion: string;
  tipoUsuario: string;
  fechaNacimiento: string;
  codSexo: string;
  codPaisResidencia: string;
  codMunicipioResidencia: string;
  codZonaTerritorialResidencia: string;
  incapacidad: string;
  codPaisOrigen: string;
}

const emptyForm: FormData = {
  nombres: "", primerApellido: "", segundoApellido: "",
  estadoTratamiento: "en_tratamiento",
  tipoDocumentoIdentificacion: "", numDocumentoIdentificacion: "",
  tipoUsuario: "", fechaNacimiento: "", codSexo: "",
  codPaisResidencia: "", codMunicipioResidencia: "",
  codZonaTerritorialResidencia: "", incapacidad: "", codPaisOrigen: "",
};

export default function PatientForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { profile } = useAuth();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loadingData, setLoadingData] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      getPatientById(id).then(p => {
        if (p) {
          const { id: _, ...rest } = p;
          setForm(rest as FormData);
        } else {
          navigate("/dashboard/pacientes");
        }
        setLoadingData(false);
      }).catch(() => { navigate("/dashboard/pacientes"); });
    }
  }, [id, navigate]);

  const set = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    // Backend enforces all validation rules (required fields, document format, date format, duplicates)
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!profile?.clinic_id) {
      toast({ title: "Error", description: "No se pudo determinar el consultorio.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (isEdit && id) {
        await updatePatient(id, form);
        toast({ title: "Paciente actualizado", description: "Los datos fueron guardados correctamente." });
      } else {
        await addPatient(profile.clinic_id, form);
        toast({ title: "Paciente registrado", description: "El paciente fue creado exitosamente." });
      }
      navigate("/dashboard/pacientes");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return <div className="text-center py-16 text-muted-foreground">Cargando...</div>;
  }

  const dateValue = form.fechaNacimiento ? new Date(form.fechaNacimiento + "T00:00:00") : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/pacientes")}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-secondary font-display">{isEdit ? "Editar Paciente" : "Agregar Paciente"}</h1>
          <p className="text-sm text-muted-foreground">{isEdit ? "Modifica los datos del paciente" : "Completa todos los campos para registrar un nuevo paciente"}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Información Personal</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Nombre(s) *</Label>
            <Input value={form.nombres} onChange={e => set("nombres", e.target.value)} placeholder="Ej: Carlos Eduardo" />
            {errors.nombres && <p className="text-xs text-destructive">{errors.nombres}</p>}
          </div>
          <div className="space-y-2">
            <Label>Primer Apellido *</Label>
            <Input value={form.primerApellido} onChange={e => set("primerApellido", e.target.value)} placeholder="Ej: Gómez" />
            {errors.primerApellido && <p className="text-xs text-destructive">{errors.primerApellido}</p>}
          </div>
          <div className="space-y-2">
            <Label>Segundo Apellido *</Label>
            <Input value={form.segundoApellido} onChange={e => set("segundoApellido", e.target.value)} placeholder="Ej: Ramírez" />
            {errors.segundoApellido && <p className="text-xs text-destructive">{errors.segundoApellido}</p>}
          </div>
          <div className="space-y-2">
            <Label>Estado del tratamiento</Label>
            <div className="flex items-center gap-3 h-10">
              <Switch checked={form.estadoTratamiento === "en_tratamiento"} onCheckedChange={(checked) => setForm(prev => ({ ...prev, estadoTratamiento: checked ? "en_tratamiento" : "finalizado" }))} />
              <span className="text-sm font-medium">{form.estadoTratamiento === "en_tratamiento" ? "En tratamiento" : "Finalizado"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Identificación</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tipo de documento *</Label>
            <SearchableSelect options={tipoDocumentoOptions} value={form.tipoDocumentoIdentificacion} onValueChange={v => set("tipoDocumentoIdentificacion", v)} placeholder="Seleccionar tipo" searchPlaceholder="Buscar tipo de documento..." />
            {errors.tipoDocumentoIdentificacion && <p className="text-xs text-destructive">{errors.tipoDocumentoIdentificacion}</p>}
          </div>
          <div className="space-y-2">
            <Label>Número de documento *</Label>
            <Input value={form.numDocumentoIdentificacion} onChange={e => set("numDocumentoIdentificacion", e.target.value)} placeholder="Ej: 1020304050" />
            {errors.numDocumentoIdentificacion && <p className="text-xs text-destructive">{errors.numDocumentoIdentificacion}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Datos Demográficos</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tipo de usuario *</Label>
            <SearchableSelect options={tipoUsuarioOptions} value={form.tipoUsuario} onValueChange={v => set("tipoUsuario", v)} placeholder="Seleccionar tipo" searchPlaceholder="Buscar tipo de usuario..." />
            {errors.tipoUsuario && <p className="text-xs text-destructive">{errors.tipoUsuario}</p>}
          </div>
          <div className="space-y-2">
            <Label>Fecha de nacimiento *</Label>
            <div className="flex gap-2">
              <DateInput value={form.fechaNacimiento} onChange={v => set("fechaNacimiento", v)} className="flex-1" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" type="button"><CalendarIcon className="h-4 w-4" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateValue} onSelect={date => { if (date) set("fechaNacimiento", format(date, "yyyy-MM-dd")); }} disabled={date => date > new Date()} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            {errors.fechaNacimiento && <p className="text-xs text-destructive">{errors.fechaNacimiento}</p>}
          </div>
          <div className="space-y-2">
            <Label>Sexo *</Label>
            <Select value={form.codSexo} onValueChange={v => set("codSexo", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>{codSexoOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
            {errors.codSexo && <p className="text-xs text-destructive">{errors.codSexo}</p>}
          </div>
          <div className="space-y-2">
            <Label>Incapacidad *</Label>
            <Select value={form.incapacidad} onValueChange={v => set("incapacidad", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
              <SelectContent>{incapacidadOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
            {errors.incapacidad && <p className="text-xs text-destructive">{errors.incapacidad}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ubicación</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>País de residencia *</Label>
            <SearchableSelect options={paisOptions} value={form.codPaisResidencia} onValueChange={v => set("codPaisResidencia", v)} placeholder="Seleccionar país" searchPlaceholder="Buscar país..." />
            {errors.codPaisResidencia && <p className="text-xs text-destructive">{errors.codPaisResidencia}</p>}
          </div>
          <div className="space-y-2">
            <Label>Municipio de residencia *</Label>
            <SearchableSelect options={municipioOptions} value={form.codMunicipioResidencia} onValueChange={v => set("codMunicipioResidencia", v)} placeholder="Seleccionar municipio" searchPlaceholder="Buscar municipio..." />
            {errors.codMunicipioResidencia && <p className="text-xs text-destructive">{errors.codMunicipioResidencia}</p>}
          </div>
          <div className="space-y-2">
            <Label>Zona territorial *</Label>
            <Select value={form.codZonaTerritorialResidencia} onValueChange={v => set("codZonaTerritorialResidencia", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar zona" /></SelectTrigger>
              <SelectContent>{zonaTerritorialOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
            {errors.codZonaTerritorialResidencia && <p className="text-xs text-destructive">{errors.codZonaTerritorialResidencia}</p>}
          </div>
          <div className="space-y-2">
            <Label>País de origen *</Label>
            <SearchableSelect options={paisOptions} value={form.codPaisOrigen} onValueChange={v => set("codPaisOrigen", v)} placeholder="Seleccionar país" searchPlaceholder="Buscar país..." />
            {errors.codPaisOrigen && <p className="text-xs text-destructive">{errors.codPaisOrigen}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/dashboard/pacientes")}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar paciente"}
        </Button>
      </div>
    </div>
  );
}
