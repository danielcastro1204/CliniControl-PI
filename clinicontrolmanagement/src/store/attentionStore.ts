import { api } from "@/integrations/api";
import { ClinicalAttention, ConsultaEntry, ProcedimientoEntry } from "@/types/attention";

function toConsulta(row: any): ConsultaEntry {
  return {
    codigoConsulta: row.codigo_consulta,
    modalidadGrupoServicioTecSal: row.modalidad_grupo_servicio_tec_sal,
    grupoServicios: row.grupo_servicios,
    codServicio: row.cod_servicio,
    finalidadTecnologiaSalud: row.finalidad_tecnologia_salud,
    causaMotivoAtencion: row.causa_motivo_atencion,
    codigoPrincipalDiagnostico: row.codigo_principal_diagnostico,
    tipoDiagnosticoPrincipal: row.tipo_diagnostico_principal,
    valorServicio: row.valor_servicio,
    conceptoRecaudo: row.concepto_recaudo,
    valorPagoModerador: row.valor_pago_moderador,
    numFEVPagoModerador: row.num_fev_pago_moderador,
    dentistId: row.dentist_id || "",
    fechaInicioAtencion: row.fecha_inicio_atencion,
  };
}

function toProcedimiento(row: any): ProcedimientoEntry {
  return {
    codProcedimiento: row.cod_procedimiento,
    viaIngresoServicioSalud: row.via_ingreso_servicio_salud,
    modalidadGrupoServicioTecSal: row.modalidad_grupo_servicio_tec_sal,
    grupoServicios: row.grupo_servicios,
    codServicio: row.cod_servicio,
    finalidadTecnologiaSalud: row.finalidad_tecnologia_salud,
    codigoPrincipalDiagnostico: row.codigo_principal_diagnostico,
    valorServicio: row.valor_servicio,
    conceptoRecaudo: row.concepto_recaudo,
    valorPagoModerador: row.valor_pago_moderador,
    numFEVPagoModerador: row.num_fev_pago_moderador,
    dentistId: row.dentist_id || "",
    fechaInicioAtencion: row.fecha_inicio_atencion,
  };
}

function toAttention(row: any): ClinicalAttention {
  return {
    id: row.id,
    patientId: row.patient_id,
    dentistId: row.dentist_id || "",
    codPrestador: row.cod_prestador,
    numDocumentoObligado: row.num_documento_obligado,
    consecutivoUsuario: row.consecutivo_usuario,
    fechaInicialAtencion: row.fecha_inicial_atencion,
    numAutorizacion: row.num_autorizacion,
    tipoDocumentoIdentificacion: row.tipo_documento_identificacion,
    numeroDocumentoIdentificacion: row.numero_documento_identificacion,
    consultaEnabled: row.consulta_enabled,
    consultas: (row.consultas || []).map(toConsulta),
    procedimientoEnabled: row.procedimiento_enabled,
    procedimientos: (row.procedimientos || []).map(toProcedimiento),
    numeroFactura: row.numero_factura,
    tipoNota: row.tipo_nota,
    numeroNota: row.numero_nota,
    createdAt: row.created_at,
  };
}

export async function getAllAttentions(): Promise<ClinicalAttention[]> {
  const { data, error } = await api.from("attentions").select("*").order("created_at", { ascending: false }).execute();
  if (error) throw error;
  return (data || []).map(toAttention);
}

export async function getAttentionsByPatient(patientId: string): Promise<ClinicalAttention[]> {
  const { data, error } = await api.from("attentions").select("*").eq("patient_id", patientId).order("created_at", { ascending: false }).execute();
  if (error) throw error;
  return (data || []).map(toAttention);
}

export async function getAttentionById(id: string): Promise<ClinicalAttention | null> {
  const { data, error } = await api.from("attentions").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return toAttention(data);
}

export async function addAttention(
  clinicId: string,
  data: Omit<ClinicalAttention, "id" | "createdAt">
): Promise<ClinicalAttention> {
  // Single atomic POST — backend creates attention + consultas + procedimientos
  // and derives fechaInicialAtencion from first child date
  const { data: result, error } = await api
    .from("attentions")
    .insert({
      patient_id: data.patientId,
      dentist_id: data.dentistId || null,
      cod_prestador: data.codPrestador,
      num_documento_obligado: data.numDocumentoObligado,
      consecutivo_usuario: data.consecutivoUsuario,
      num_autorizacion: data.numAutorizacion,
      tipo_documento_identificacion: data.tipoDocumentoIdentificacion,
      numero_documento_identificacion: data.numeroDocumentoIdentificacion,
      consulta_enabled: data.consultaEnabled,
      procedimiento_enabled: data.procedimientoEnabled,
      numero_factura: data.numeroFactura,
      tipo_nota: data.tipoNota,
      numero_nota: data.numeroNota,
      consultas: data.consultaEnabled ? data.consultas.map((c, i) => ({
        dentist_id: c.dentistId || null,
        fecha_inicio_atencion: c.fechaInicioAtencion,
        codigo_consulta: c.codigoConsulta,
        modalidad_grupo_servicio_tec_sal: c.modalidadGrupoServicioTecSal,
        grupo_servicios: c.grupoServicios,
        cod_servicio: c.codServicio,
        finalidad_tecnologia_salud: c.finalidadTecnologiaSalud,
        causa_motivo_atencion: c.causaMotivoAtencion,
        codigo_principal_diagnostico: c.codigoPrincipalDiagnostico,
        tipo_diagnostico_principal: c.tipoDiagnosticoPrincipal,
        valor_servicio: c.valorServicio,
        concepto_recaudo: c.conceptoRecaudo,
        valor_pago_moderador: c.valorPagoModerador,
        num_fev_pago_moderador: c.numFEVPagoModerador,
        sort_order: i,
      })) : [],
      procedimientos: data.procedimientoEnabled ? data.procedimientos.map((p, i) => ({
        dentist_id: p.dentistId || null,
        fecha_inicio_atencion: p.fechaInicioAtencion,
        cod_procedimiento: p.codProcedimiento,
        via_ingreso_servicio_salud: p.viaIngresoServicioSalud,
        modalidad_grupo_servicio_tec_sal: p.modalidadGrupoServicioTecSal,
        grupo_servicios: p.grupoServicios,
        cod_servicio: p.codServicio,
        finalidad_tecnologia_salud: p.finalidadTecnologiaSalud,
        codigo_principal_diagnostico: p.codigoPrincipalDiagnostico,
        valor_servicio: p.valorServicio,
        concepto_recaudo: p.conceptoRecaudo,
        valor_pago_moderador: p.valorPagoModerador,
        num_fev_pago_moderador: p.numFEVPagoModerador,
        sort_order: i,
      })) : [],
    })
    .select()
    .single();

  if (error) throw error;
  return toAttention(result);
}
