import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, UserCog, Stethoscope, Receipt, Scissors, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getPatientById, type Patient } from "@/store/patientStore";
import { addAttention } from "@/store/attentionStore";
import { getTipoDocLabel } from "@/types/patient";
import { api } from "@/integrations/api";
import {
  codigoConsultaOptions, modalidadOptions, grupoServiciosOptions,
  tipoDiagnosticoPrincipalOptions, conceptoRecaudoOptions,
  tipoNotaOptions, ConsultaEntry, ProcedimientoEntry,
} from "@/types/attention";
import {
  codServicioOptions, finalidadTecnologiaSaludOptions,
  causaMotivoAtencionNewOptions, cie10DiagnosticoOptions,
  codigoProcedimientoOptions, viaIngresoServicioSaludOptions,
} from "@/data/attentionCatalogs";

interface DentistOption {
  id: string; nombre: string; identification: string; cod_prestador: string; tipo_documento: string;
}

const nowStr = () => format(new Date(), "yyyy-MM-dd HH:mm");

const emptyConsulta = (): ConsultaEntry => ({
  codigoConsulta: "", modalidadGrupoServicioTecSal: "01", grupoServicios: "01",
  codServicio: "", finalidadTecnologiaSalud: "", causaMotivoAtencion: "",
  codigoPrincipalDiagnostico: "", tipoDiagnosticoPrincipal: "",
  valorServicio: "0", conceptoRecaudo: "", valorPagoModerador: "0",
  numFEVPagoModerador: "", dentistId: "", fechaInicioAtencion: nowStr(),
});

const emptyProcedimiento = (): ProcedimientoEntry => ({
  codProcedimiento: "", viaIngresoServicioSalud: "01",
  modalidadGrupoServicioTecSal: "01", grupoServicios: "01",
  codServicio: "", finalidadTecnologiaSalud: "",
  codigoPrincipalDiagnostico: "",
  valorServicio: "0", conceptoRecaudo: "", valorPagoModerador: "0",
  numFEVPagoModerador: "", dentistId: "", fechaInicioAtencion: nowStr(),
});

export default function AttentionForm() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useAuth();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [dentistOptions, setDentistOptions] = useState<{ value: string; label: string }[]>([]);
  const [dentistsData, setDentistsData] = useState<DentistOption[]>([]);

  useEffect(() => {
    if (patientId) {
      getPatientById(patientId).then(p => { setPatient(p); setLoadingPatient(false); });
    }
  }, [patientId]);

  useEffect(() => {
    const fetchDentists = async () => {
      const { data, error } = await api
        .from("dentists").select("id, first_name, last_name_1, last_name_2, identification, cod_prestador, tipo_documento")
        .eq("is_active", true).order("first_name").execute();
      if (!error && data) {
        const mapped = data.map((d: any) => ({
          id: d.id,
          nombre: `${d.first_name} ${d.last_name_1} ${d.last_name_2 || ""}`.trim(),
          identification: d.identification, cod_prestador: d.cod_prestador, tipo_documento: d.tipo_documento || "CC",
        }));
        setDentistsData(mapped);
        setDentistOptions(mapped.map(d => ({ value: d.id, label: d.nombre })));
      }
    };
    fetchDentists();
  }, []);

  const [activeTab, setActiveTab] = useState("prestador");
  const [dentistId, setDentistId] = useState("");
  const [codPrestador, setCodPrestador] = useState("");
  const [numDocumentoObligado, setNumDocumentoObligado] = useState("");
  const [numAutorizacion, setNumAutorizacion] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [tipoNota, setTipoNota] = useState("");
  const [numeroNota, setNumeroNota] = useState("");
  const [consultaEnabled, setConsultaEnabled] = useState(false);
  const [procedimientoEnabled, setProcedimientoEnabled] = useState(false);
  const [consultas, setConsultas] = useState<ConsultaEntry[]>([emptyConsulta()]);
  const [procedimientos, setProcedimientos] = useState<ProcedimientoEntry[]>([emptyProcedimiento()]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  if (loadingPatient) return <div className="space-y-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-40 w-full" /></div>;

  if (!patient) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/dashboard/pacientes")} className="gap-2"><ArrowLeft className="h-4 w-4" /> Volver a pacientes</Button>
        <p className="text-muted-foreground">Paciente no encontrado.</p>
      </div>
    );
  }

  const selectDentist = (id: string) => {
    setDentistId(id);
    const d = dentistsData.find(x => x.id === id);
    if (d) { setCodPrestador(d.cod_prestador); setNumDocumentoObligado(d.identification); }
    else { setCodPrestador(""); setNumDocumentoObligado(""); }
  };

  const selectedDentist = dentistsData.find(d => d.id === dentistId);
  const getDentistInfo = (dId: string) => dentistsData.find(d => d.id === dId);

  const updateConsulta = (idx: number, field: keyof ConsultaEntry, value: string) => {
    setConsultas(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    setErrors(prev => { const n = { ...prev }; delete n[`consulta_${idx}_${field}`]; return n; });
  };
  const updateProcedimiento = (idx: number, field: keyof ProcedimientoEntry, value: string) => {
    setProcedimientos(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
    setErrors(prev => { const n = { ...prev }; delete n[`proc_${idx}_${field}`]; return n; });
  };

  const addConsulta = () => setConsultas(prev => [...prev, emptyConsulta()]);
  const removeConsulta = (idx: number) => { if (consultas.length > 1) setConsultas(prev => prev.filter((_, i) => i !== idx)); };
  const addProcedimiento = () => setProcedimientos(prev => [...prev, emptyProcedimiento()]);
  const removeProcedimiento = (idx: number) => { if (procedimientos.length > 1) setProcedimientos(prev => prev.filter((_, i) => i !== idx)); };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!dentistId) newErrors.dentistId = "Debe seleccionar un odontólogo";
    if (!numeroFactura.trim()) newErrors.numeroFactura = "El número de factura es obligatorio";
    if (!consultaEnabled && !procedimientoEnabled)
      newErrors.tabs = "Debe habilitar al menos una sección: Consulta o Procedimiento";

    if (consultaEnabled) {
      consultas.forEach((c, idx) => {
        if (!c.dentistId) newErrors[`consulta_${idx}_dentistId`] = "Seleccione un odontólogo";
        if (!c.codigoConsulta) newErrors[`consulta_${idx}_codigoConsulta`] = "Campo obligatorio";
        if (!c.codigoPrincipalDiagnostico) newErrors[`consulta_${idx}_codigoPrincipalDiagnostico`] = "Campo obligatorio";
        if (!c.tipoDiagnosticoPrincipal) newErrors[`consulta_${idx}_tipoDiagnosticoPrincipal`] = "Campo obligatorio";
        if (!c.finalidadTecnologiaSalud) newErrors[`consulta_${idx}_finalidadTecnologiaSalud`] = "Campo obligatorio";
        if (!c.causaMotivoAtencion) newErrors[`consulta_${idx}_causaMotivoAtencion`] = "Campo obligatorio";
        if (!c.conceptoRecaudo) newErrors[`consulta_${idx}_conceptoRecaudo`] = "Campo obligatorio";
      });
    }

    if (procedimientoEnabled) {
      procedimientos.forEach((p, idx) => {
        if (!p.dentistId) newErrors[`proc_${idx}_dentistId`] = "Seleccione un odontólogo";
        if (!p.codProcedimiento) newErrors[`proc_${idx}_codProcedimiento`] = "Campo obligatorio";
        if (!p.codigoPrincipalDiagnostico) newErrors[`proc_${idx}_codigoPrincipalDiagnostico`] = "Campo obligatorio";
        if (!p.finalidadTecnologiaSalud) newErrors[`proc_${idx}_finalidadTecnologiaSalud`] = "Campo obligatorio";
        if (!p.conceptoRecaudo) newErrors[`proc_${idx}_conceptoRecaudo`] = "Campo obligatorio";
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toast({ title: "Formulario incompleto", description: errors.tabs || "Complete los campos obligatorios.", variant: "destructive" });
      return;
    }
    if (!profile?.clinic_id) {
      toast({ title: "Error", description: "No se pudo determinar el consultorio.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await addAttention(profile.clinic_id, {
        patientId: patient.id,
        dentistId,
        codPrestador,
        numDocumentoObligado,
        consecutivoUsuario: "1",
        fechaInicialAtencion: "", // Backend derives from first consulta/procedimiento date
        numAutorizacion,
        tipoDocumentoIdentificacion: patient.tipoDocumentoIdentificacion,
        numeroDocumentoIdentificacion: patient.numDocumentoIdentificacion,
        consultaEnabled,
        consultas: consultaEnabled ? consultas : [],
        procedimientoEnabled,
        procedimientos: procedimientoEnabled ? procedimientos : [],
        numeroFactura: numeroFactura.toUpperCase(),
        tipoNota,
        numeroNota,
      });
      toast({ title: "Atención registrada", description: "La atención clínica se registró exitosamente." });
      navigate(`/dashboard/pacientes/${patient.id}`);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const FieldErr = ({ k }: { k: string }) => errors[k] ? <p className="text-sm text-destructive">{errors[k]}</p> : null;

  const renderDentistAndDate = (
    type: "consulta" | "proc", idx: number,
    currentDentistId: string, currentFecha: string,
    onDentistChange: (v: string) => void, onFechaChange: (v: string) => void,
  ) => {
    const info = getDentistInfo(currentDentistId);
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Odontólogo responsable *</Label>
            <SearchableSelect options={dentistOptions} value={currentDentistId} onValueChange={onDentistChange} placeholder="Seleccionar odontólogo..." searchPlaceholder="Buscar odontólogo..." />
            <FieldErr k={`${type}_${idx}_dentistId`} />
          </div>
          <div className="space-y-2">
            <Label>Fecha y hora de atención *</Label>
            <Input value={currentFecha} onChange={e => onFechaChange(e.target.value)} placeholder="YYYY-MM-DD HH:MM" />
            <FieldErr k={`${type}_${idx}_fechaInicioAtencion`} />
          </div>
        </div>
        {info && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1"><Label className="text-muted-foreground text-xs">Tipo documento</Label><Input value={info.tipo_documento} readOnly className="bg-muted" /></div>
            <div className="space-y-1"><Label className="text-muted-foreground text-xs">Nº Identificación</Label><Input value={info.identification} readOnly className="bg-muted" /></div>
            <div className="space-y-1"><Label className="text-muted-foreground text-xs">Código prestador</Label><Input value={info.cod_prestador} readOnly className="bg-muted" /></div>
          </div>
        )}
        <Separator />
      </>
    );
  };

  const renderConsultaCard = (c: ConsultaEntry, idx: number) => (
    <Card key={idx} className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">Consulta {consultas.length > 1 ? `#${idx + 1}` : ""}</CardTitle>
          <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Consecutivo: {idx + 1}</span>
        </div>
        {consultas.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeConsulta(idx)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>}
      </CardHeader>
      <CardContent className="space-y-4">
        {renderDentistAndDate("consulta", idx, c.dentistId, c.fechaInicioAtencion, v => updateConsulta(idx, "dentistId", v), v => updateConsulta(idx, "fechaInicioAtencion", v))}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Código consulta *</Label><SearchableSelect options={codigoConsultaOptions} value={c.codigoConsulta} onValueChange={v => updateConsulta(idx, "codigoConsulta", v)} placeholder="Seleccionar..." searchPlaceholder="Buscar código..." /><FieldErr k={`consulta_${idx}_codigoConsulta`} /></div>
          <div className="space-y-2"><Label>Modalidad *</Label><SearchableSelect options={modalidadOptions} value={c.modalidadGrupoServicioTecSal} onValueChange={v => updateConsulta(idx, "modalidadGrupoServicioTecSal", v)} placeholder="Seleccionar..." searchPlaceholder="Buscar..." /><FieldErr k={`consulta_${idx}_modalidadGrupoServicioTecSal`} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Grupo de servicios *</Label><SearchableSelect options={grupoServiciosOptions} value={c.grupoServicios} onValueChange={v => updateConsulta(idx, "grupoServicios", v)} placeholder="Seleccionar..." searchPlaceholder="Buscar..." /><FieldErr k={`consulta_${idx}_grupoServicios`} /></div>
          <div className="space-y-2"><Label>Código servicio *</Label><SearchableSelect options={codServicioOptions} value={c.codServicio} onValueChange={v => updateConsulta(idx, "codServicio", v)} placeholder="Seleccionar servicio..." searchPlaceholder="Buscar código o nombre..." /><FieldErr k={`consulta_${idx}_codServicio`} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Finalidad tecnología salud *</Label><SearchableSelect options={finalidadTecnologiaSaludOptions} value={c.finalidadTecnologiaSalud} onValueChange={v => updateConsulta(idx, "finalidadTecnologiaSalud", v)} placeholder="Seleccionar..." searchPlaceholder="Buscar finalidad..." /><FieldErr k={`consulta_${idx}_finalidadTecnologiaSalud`} /></div>
          <div className="space-y-2"><Label>Causa / motivo atención *</Label><SearchableSelect options={causaMotivoAtencionNewOptions} value={c.causaMotivoAtencion} onValueChange={v => updateConsulta(idx, "causaMotivoAtencion", v)} placeholder="Seleccionar..." searchPlaceholder="Buscar causa..." /><FieldErr k={`consulta_${idx}_causaMotivoAtencion`} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Código diagnóstico principal (CIE-10) *</Label><SearchableSelect options={cie10DiagnosticoOptions} value={c.codigoPrincipalDiagnostico} onValueChange={v => updateConsulta(idx, "codigoPrincipalDiagnostico", v)} placeholder="Seleccionar diagnóstico..." searchPlaceholder="Buscar por código o nombre..." /><FieldErr k={`consulta_${idx}_codigoPrincipalDiagnostico`} /></div>
          <div className="space-y-2"><Label>Tipo diagnóstico principal *</Label><SearchableSelect options={tipoDiagnosticoPrincipalOptions} value={c.tipoDiagnosticoPrincipal} onValueChange={v => updateConsulta(idx, "tipoDiagnosticoPrincipal", v)} placeholder="Seleccionar..." searchPlaceholder="Buscar..." /><FieldErr k={`consulta_${idx}_tipoDiagnosticoPrincipal`} /></div>
        </div>
        <Separator />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2"><Label>Valor servicio</Label><Input type="number" min="0" value={c.valorServicio} onChange={e => updateConsulta(idx, "valorServicio", e.target.value)} /></div>
          <div className="space-y-2"><Label>Concepto recaudo *</Label><SearchableSelect options={conceptoRecaudoOptions} value={c.conceptoRecaudo} onValueChange={v => updateConsulta(idx, "conceptoRecaudo", v)} placeholder="Seleccionar..." searchPlaceholder="Buscar..." /><FieldErr k={`consulta_${idx}_conceptoRecaudo`} /></div>
          <div className="space-y-2"><Label>Valor pago moderador</Label><Input type="number" min="0" value={c.valorPagoModerador} onChange={e => updateConsulta(idx, "valorPagoModerador", e.target.value)} /></div>
          <div className="space-y-2"><Label>Nº FEV pago moderador</Label><Input value={c.numFEVPagoModerador} onChange={e => updateConsulta(idx, "numFEVPagoModerador", e.target.value)} placeholder="Opcional" /></div>
        </div>
      </CardContent>
    </Card>
  );

  const renderProcedimientoCard = (p: ProcedimientoEntry, idx: number) => (
    <Card key={idx} className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <CardTitle className="text-base">Procedimiento {procedimientos.length > 1 ? `#${idx + 1}` : ""}</CardTitle>
          <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Consecutivo: {idx + 1}</span>
        </div>
        {procedimientos.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeProcedimiento(idx)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>}
      </CardHeader>
      <CardContent className="space-y-4">
        {renderDentistAndDate("proc", idx, p.dentistId, p.fechaInicioAtencion, v => updateProcedimiento(idx, "dentistId", v), v => updateProcedimiento(idx, "fechaInicioAtencion", v))}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Código procedimiento *</Label><SearchableSelect options={codigoProcedimientoOptions} value={p.codProcedimiento} onValueChange={v => updateProcedimiento(idx, "codProcedimiento", v)} placeholder="Seleccionar procedimiento..." searchPlaceholder="Buscar código o nombre..." /><FieldErr k={`proc_${idx}_codProcedimiento`} /></div>
          <div className="space-y-2"><Label>Vía de ingreso a servicio de salud *</Label><SearchableSelect options={viaIngresoServicioSaludOptions} value={p.viaIngresoServicioSalud} onValueChange={v => updateProcedimiento(idx, "viaIngresoServicioSalud", v)} placeholder="Seleccionar..." searchPlaceholder="Buscar vía de ingreso..." /><FieldErr k={`proc_${idx}_viaIngresoServicioSalud`} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Modalidad *</Label><SearchableSelect options={modalidadOptions} value={p.modalidadGrupoServicioTecSal} onValueChange={v => updateProcedimiento(idx, "modalidadGrupoServicioTecSal", v)} placeholder="Seleccionar..." searchPlaceholder="Buscar..." /><FieldErr k={`proc_${idx}_modalidadGrupoServicioTecSal`} /></div>
          <div className="space-y-2"><Label>Grupo de servicios *</Label><SearchableSelect options={grupoServiciosOptions} value={p.grupoServicios} onValueChange={v => updateProcedimiento(idx, "grupoServicios", v)} placeholder="Seleccionar..." searchPlaceholder="Buscar..." /><FieldErr k={`proc_${idx}_grupoServicios`} /></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Código servicio *</Label><SearchableSelect options={codServicioOptions} value={p.codServicio} onValueChange={v => updateProcedimiento(idx, "codServicio", v)} placeholder="Seleccionar servicio..." searchPlaceholder="Buscar código o nombre..." /><FieldErr k={`proc_${idx}_codServicio`} /></div>
          <div className="space-y-2"><Label>Finalidad tecnología salud *</Label><SearchableSelect options={finalidadTecnologiaSaludOptions} value={p.finalidadTecnologiaSalud} onValueChange={v => updateProcedimiento(idx, "finalidadTecnologiaSalud", v)} placeholder="Seleccionar..." searchPlaceholder="Buscar finalidad..." /><FieldErr k={`proc_${idx}_finalidadTecnologiaSalud`} /></div>
        </div>
        <div className="space-y-2"><Label>Código diagnóstico principal *</Label><SearchableSelect options={cie10DiagnosticoOptions} value={p.codigoPrincipalDiagnostico} onValueChange={v => updateProcedimiento(idx, "codigoPrincipalDiagnostico", v)} placeholder="Seleccionar diagnóstico..." searchPlaceholder="Buscar por código o nombre..." /><FieldErr k={`proc_${idx}_codigoPrincipalDiagnostico`} /></div>
        <Separator />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2"><Label>Valor servicio</Label><Input type="number" min="0" value={p.valorServicio} onChange={e => updateProcedimiento(idx, "valorServicio", e.target.value)} /></div>
          <div className="space-y-2"><Label>Concepto recaudo *</Label><SearchableSelect options={conceptoRecaudoOptions} value={p.conceptoRecaudo} onValueChange={v => updateProcedimiento(idx, "conceptoRecaudo", v)} placeholder="Seleccionar..." searchPlaceholder="Buscar..." /><FieldErr k={`proc_${idx}_conceptoRecaudo`} /></div>
          <div className="space-y-2"><Label>Valor pago moderador</Label><Input type="number" min="0" value={p.valorPagoModerador} onChange={e => updateProcedimiento(idx, "valorPagoModerador", e.target.value)} /></div>
          <div className="space-y-2"><Label>Nº FEV pago moderador</Label><Input value={p.numFEVPagoModerador} onChange={e => updateProcedimiento(idx, "numFEVPagoModerador", e.target.value)} placeholder="Opcional" /></div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/pacientes/${patient.id}`)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold text-secondary font-display">Nueva Atención Clínica</h1>
          <p className="text-sm text-muted-foreground">Paciente: {patient.nombres} {patient.primerApellido} — {getTipoDocLabel(patient.tipoDocumentoIdentificacion).split(" - ")[0]} {patient.numDocumentoIdentificacion}</p>
        </div>
      </div>

      {errors.tabs && <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">{errors.tabs}</div>}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prestador" className="gap-2"><UserCog className="h-4 w-4" /><span className="hidden sm:inline">Prestador</span></TabsTrigger>
          <TabsTrigger value="consulta" className="gap-2"><Stethoscope className="h-4 w-4" /><span className="hidden sm:inline">Consulta</span></TabsTrigger>
          <TabsTrigger value="procedimiento" className="gap-2"><Scissors className="h-4 w-4" /><span className="hidden sm:inline">Procedimiento</span></TabsTrigger>
          <TabsTrigger value="transaccion" className="gap-2"><Receipt className="h-4 w-4" /><span className="hidden sm:inline">Transacción</span></TabsTrigger>
        </TabsList>

        <TabsContent value="prestador">
          <Card>
            <CardHeader><CardTitle className="text-lg">Odontólogo Responsable General</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label>Nombre del odontólogo *</Label><SearchableSelect options={dentistOptions} value={dentistId} onValueChange={selectDentist} placeholder="Seleccionar odontólogo..." searchPlaceholder="Buscar odontólogo..." /><FieldErr k="dentistId" /></div>
              {selectedDentist && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-1"><Label className="text-muted-foreground text-xs">Tipo documento</Label><Input value={selectedDentist.tipo_documento} readOnly className="bg-muted" /></div>
                  <div className="space-y-1"><Label className="text-muted-foreground text-xs">Número de identificación</Label><Input value={selectedDentist.identification} readOnly className="bg-muted" /></div>
                  <div className="space-y-1"><Label className="text-muted-foreground text-xs">Código de prestador</Label><Input value={selectedDentist.cod_prestador} readOnly className="bg-muted" /></div>
                </div>
              )}
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nº Autorización</Label><Input value={numAutorizacion} onChange={e => setNumAutorizacion(e.target.value)} placeholder="Opcional" /></div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1"><Label className="text-muted-foreground text-xs">Tipo Doc. Paciente</Label><Input value={getTipoDocLabel(patient.tipoDocumentoIdentificacion)} readOnly className="bg-muted" /></div>
                <div className="space-y-1"><Label className="text-muted-foreground text-xs">Nº Doc. Paciente</Label><Input value={patient.numDocumentoIdentificacion} readOnly className="bg-muted" /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consulta">
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">Consulta</CardTitle>
                <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">{consultaEnabled ? "Activa" : "Inactiva"}</span><Switch checked={consultaEnabled} onCheckedChange={setConsultaEnabled} /></div>
              </CardHeader>
            </Card>
            {consultaEnabled ? (
              <>{consultas.map((c, i) => renderConsultaCard(c, i))}<Button variant="outline" onClick={addConsulta} className="gap-2 w-full"><Plus className="h-4 w-4" />Agregar otra consulta</Button></>
            ) : (
              <Card><CardContent className="py-8 text-center text-muted-foreground">La pestaña de Consulta está desactivada.</CardContent></Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="procedimiento">
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="text-lg">Procedimiento</CardTitle>
                <div className="flex items-center gap-2"><span className="text-sm text-muted-foreground">{procedimientoEnabled ? "Activo" : "Inactivo"}</span><Switch checked={procedimientoEnabled} onCheckedChange={setProcedimientoEnabled} /></div>
              </CardHeader>
            </Card>
            {procedimientoEnabled ? (
              <>{procedimientos.map((p, i) => renderProcedimientoCard(p, i))}<Button variant="outline" onClick={addProcedimiento} className="gap-2 w-full"><Plus className="h-4 w-4" />Agregar otro procedimiento</Button></>
            ) : (
              <Card><CardContent className="py-8 text-center text-muted-foreground">La pestaña de Procedimiento está desactivada.</CardContent></Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="transaccion">
          <Card>
            <CardHeader><CardTitle className="text-lg">Transacción</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1"><Label className="text-muted-foreground text-xs">Nº Identificación Odontólogo</Label><Input value={numDocumentoObligado} readOnly className="bg-muted" placeholder="Seleccione odontólogo primero" /></div>
              <div className="space-y-2"><Label>Número de factura *</Label><Input value={numeroFactura} onChange={e => { setNumeroFactura(e.target.value.toUpperCase()); setErrors(p => ({ ...p, numeroFactura: undefined as any })); }} placeholder="Ej: FE001" /><FieldErr k="numeroFactura" /></div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Tipo de nota</Label>
                  <Select value={tipoNota} onValueChange={setTipoNota}><SelectTrigger><SelectValue placeholder="Sin nota" /></SelectTrigger>
                    <SelectContent>{tipoNotaOptions.map(o => <SelectItem key={o.value || "__none__"} value={o.value || "__none__"}>{o.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Número de nota</Label><Input value={numeroNota} onChange={e => setNumeroNota(e.target.value)} disabled={!tipoNota || tipoNota === "__none__"} placeholder={!tipoNota || tipoNota === "__none__" ? "Seleccione tipo de nota primero" : "Ej: 001"} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={() => navigate(`/dashboard/pacientes/${patient.id}`)}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={saving} className="gap-2"><Save className="h-4 w-4" />{saving ? "Guardando..." : "Registrar atención"}</Button>
      </div>
    </div>
  );
}
