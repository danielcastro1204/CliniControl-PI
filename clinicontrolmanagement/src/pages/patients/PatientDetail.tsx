import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, ClipboardPlus, Stethoscope, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { getPatientById, type Patient } from "@/store/patientStore";
import { getAttentionsByPatient } from "@/store/attentionStore";
import { api } from "@/integrations/api";
import {
  getTipoDocLabel, getTipoUsuarioLabel, getSexoLabel,
  getPaisLabel, getMunicipioLabel, getZonaLabel,
} from "@/types/patient";
import { ClinicalAttention, ConsultaEntry, ProcedimientoEntry, codigoConsultaOptions } from "@/types/attention";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-secondary">{value || "—"}</p>
    </div>
  );
}

interface DentistMap {
  [id: string]: { nombre: string; identification: string; cod_prestador: string; tipo_documento: string };
}

function AttentionDetailCard({ att, dentistMap }: { att: ClinicalAttention; dentistMap: DentistMap }) {
  const [open, setOpen] = useState(false);
  const generalDentist = dentistMap[att.dentistId];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-border">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium text-secondary text-sm">{att.fechaInicialAtencion}</p>
                  <p className="text-xs text-muted-foreground">Odontólogo: {generalDentist?.nombre ?? "—"}</p>
                </div>
                <div className="flex gap-2">
                  {att.consultaEnabled && att.consultas?.length > 0 && (
                    <Badge variant="outline">{att.consultas.length} consulta{att.consultas.length > 1 ? "s" : ""}</Badge>
                  )}
                  {att.procedimientoEnabled && att.procedimientos?.length > 0 && (
                    <Badge variant="outline">{att.procedimientos.length} procedimiento{att.procedimientos.length > 1 ? "s" : ""}</Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{att.numeroFactura}</Badge>
                {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <Separator />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Field label="Cód. Prestador" value={att.codPrestador} />
              <Field label="Nº Doc. Obligado" value={att.numDocumentoObligado} />
              <Field label="Nº Autorización" value={att.numAutorizacion || "—"} />
              <Field label="Tipo Nota" value={att.tipoNota || "Sin nota"} />
            </div>
            {att.consultaEnabled && att.consultas?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-primary flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Consultas</h4>
                {att.consultas.map((c: ConsultaEntry, i: number) => {
                  const cDentist = c.dentistId ? dentistMap[c.dentistId] : null;
                  return (
                    <div key={i} className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Consulta #{i + 1}</span>
                        <Badge variant="secondary" className="text-xs">{codigoConsultaOptions.find(o => o.value === c.codigoConsulta)?.label || c.codigoConsulta}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <Field label="Fecha/hora" value={c.fechaInicioAtencion || att.fechaInicialAtencion} />
                        <Field label="Odontólogo" value={cDentist?.nombre || "—"} />
                        <Field label="Modalidad" value={c.modalidadGrupoServicioTecSal} />
                        <Field label="Grupo servicios" value={c.grupoServicios} />
                        <Field label="Cód. servicio" value={c.codServicio} />
                        <Field label="Finalidad" value={c.finalidadTecnologiaSalud} />
                        <Field label="Causa/motivo" value={c.causaMotivoAtencion} />
                        <Field label="Dx principal" value={c.codigoPrincipalDiagnostico} />
                        <Field label="Tipo Dx" value={c.tipoDiagnosticoPrincipal} />
                        <Field label="Valor servicio" value={c.valorServicio} />
                        <Field label="Concepto recaudo" value={c.conceptoRecaudo} />
                        <Field label="Valor pago mod." value={c.valorPagoModerador} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {att.procedimientoEnabled && att.procedimientos?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-primary flex items-center gap-2"><Stethoscope className="h-4 w-4" /> Procedimientos</h4>
                {att.procedimientos.map((p: ProcedimientoEntry, i: number) => {
                  const pDentist = p.dentistId ? dentistMap[p.dentistId] : null;
                  return (
                    <div key={i} className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Procedimiento #{i + 1}</span>
                        <Badge variant="secondary" className="text-xs">{p.codProcedimiento}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <Field label="Fecha/hora" value={p.fechaInicioAtencion || att.fechaInicialAtencion} />
                        <Field label="Odontólogo" value={pDentist?.nombre || "—"} />
                        <Field label="Vía ingreso" value={p.viaIngresoServicioSalud} />
                        <Field label="Modalidad" value={p.modalidadGrupoServicioTecSal} />
                        <Field label="Grupo servicios" value={p.grupoServicios} />
                        <Field label="Cód. servicio" value={p.codServicio} />
                        <Field label="Finalidad" value={p.finalidadTecnologiaSalud} />
                        <Field label="Dx principal" value={p.codigoPrincipalDiagnostico} />
                        <Field label="Valor servicio" value={p.valorServicio} />
                        <Field label="Concepto recaudo" value={p.conceptoRecaudo} />
                        <Field label="Valor pago mod." value={p.valorPagoModerador} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function PatientDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [attentions, setAttentions] = useState<ClinicalAttention[]>([]);
  const [dentistMap, setDentistMap] = useState<DentistMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const [p, atts] = await Promise.all([
          getPatientById(id),
          getAttentionsByPatient(id),
        ]);
        setPatient(p);
        setAttentions(atts);

        const { data } = await api
          .from("dentists")
          .select("id, first_name, last_name_1, last_name_2, identification, cod_prestador, tipo_documento");
        if (data) {
          const map: DentistMap = {};
          data.forEach((d: any) => {
            map[d.id] = {
              nombre: `${d.first_name} ${d.last_name_1} ${d.last_name_2 || ""}`.trim(),
              identification: d.identification,
              cod_prestador: d.cod_prestador,
              tipo_documento: d.tipo_documento || "CC",
            };
          });
          setDentistMap(map);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Paciente no encontrado.</p>
        <Button variant="link" onClick={() => navigate("/dashboard/pacientes")}>Volver al listado</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/pacientes")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-secondary font-display">{patient.nombres} {patient.primerApellido} {patient.segundoApellido}</h1>
            <p className="text-sm text-muted-foreground">Documento: {patient.numDocumentoIdentificacion}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/dashboard/pacientes/${id}/atencion/nueva`)} className="gap-2"><ClipboardPlus className="h-4 w-4" />Añadir atención</Button>
          <Button onClick={() => navigate(`/dashboard/pacientes/${id}/editar`)} className="gap-2"><Pencil className="h-4 w-4" />Editar</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Información Personal</CardTitle>
            <Badge variant={patient.estadoTratamiento === "en_tratamiento" ? "default" : "secondary"}>
              {patient.estadoTratamiento === "en_tratamiento" ? "En tratamiento" : "Finalizado"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Nombre(s)" value={patient.nombres} />
          <Field label="Primer Apellido" value={patient.primerApellido} />
          <Field label="Segundo Apellido" value={patient.segundoApellido} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Identificación</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Tipo de documento" value={getTipoDocLabel(patient.tipoDocumentoIdentificacion)} />
          <Field label="Número de documento" value={patient.numDocumentoIdentificacion} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Datos Demográficos</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Tipo de usuario" value={getTipoUsuarioLabel(patient.tipoUsuario)} />
          <Field label="Fecha de nacimiento" value={patient.fechaNacimiento} />
          <Field label="Sexo" value={getSexoLabel(patient.codSexo)} />
          <Field label="Incapacidad" value={patient.incapacidad} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ubicación</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="País de residencia" value={getPaisLabel(patient.codPaisResidencia)} />
          <Field label="Municipio de residencia" value={getMunicipioLabel(patient.codMunicipioResidencia)} />
          <Field label="Zona territorial" value={getZonaLabel(patient.codZonaTerritorialResidencia)} />
          <Field label="País de origen" value={getPaisLabel(patient.codPaisOrigen)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Stethoscope className="h-4 w-4" />Atenciones Clínicas</CardTitle>
          <Badge variant="secondary">{attentions.length}</Badge>
        </CardHeader>
        <CardContent>
          {attentions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No hay atenciones registradas para este paciente.</p>
          ) : (
            <div className="space-y-3">
              {attentions.map(att => <AttentionDetailCard key={att.id} att={att} dentistMap={dentistMap} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
