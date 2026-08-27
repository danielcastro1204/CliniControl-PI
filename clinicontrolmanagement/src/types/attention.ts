export interface Dentist {
  id: string;
  nombre: string;
  cedula: string;
  codPrestador: string;
  numDocumentoIdObligado: string;
}

export interface ConsultaEntry {
  codigoConsulta: string;
  modalidadGrupoServicioTecSal: string;
  grupoServicios: string;
  codServicio: string;
  finalidadTecnologiaSalud: string;
  causaMotivoAtencion: string;
  codigoPrincipalDiagnostico: string;
  tipoDiagnosticoPrincipal: string;
  valorServicio: string;
  conceptoRecaudo: string;
  valorPagoModerador: string;
  numFEVPagoModerador: string;
  // Per-consulta dentist & date
  dentistId: string;
  fechaInicioAtencion: string;
}

export interface ProcedimientoEntry {
  codProcedimiento: string;
  viaIngresoServicioSalud: string;
  modalidadGrupoServicioTecSal: string;
  grupoServicios: string;
  codServicio: string;
  finalidadTecnologiaSalud: string;
  codigoPrincipalDiagnostico: string;
  valorServicio: string;
  conceptoRecaudo: string;
  valorPagoModerador: string;
  numFEVPagoModerador: string;
  // Per-procedimiento dentist & date
  dentistId: string;
  fechaInicioAtencion: string;
}

export interface ClinicalAttention {
  id: string;
  patientId: string;
  dentistId: string;
  codPrestador: string;
  numDocumentoObligado: string;
  consecutivoUsuario: string;
  fechaInicialAtencion: string;
  numAutorizacion: string;
  tipoDocumentoIdentificacion: string;
  numeroDocumentoIdentificacion: string;
  consultaEnabled: boolean;
  consultas: ConsultaEntry[];
  procedimientoEnabled: boolean;
  procedimientos: ProcedimientoEntry[];
  numeroFactura: string;
  tipoNota: string;
  numeroNota: string;
  createdAt: string;
}


// --- Catalog options kept here for backward compat (short lists) ---

export const codigoConsultaOptions = [
  { value: "890203", label: "890203 - Consulta primera vez odontología general" },
  { value: "890204", label: "890204 - Consulta primera vez odontología especializada" },
  { value: "890303", label: "890303 - Control de odontología general" },
  { value: "890304", label: "890304 - Control de odontología especializada" },
  { value: "890703", label: "890703 - Urgencia odontología general" },
  { value: "890704", label: "890704 - Urgencia odontología especializada" },
];

export const modalidadOptions = [
  { value: "01", label: "01 - Intramural" },
  { value: "02", label: "02 - Extramural unidad móvil" },
  { value: "03", label: "03 - Extramural domiciliaria" },
  { value: "04", label: "04 - Extramural jornada de salud" },
  { value: "06", label: "06 - Telemedicina interactiva" },
  { value: "07", label: "07 - Telemedicina no interactiva" },
  { value: "08", label: "08 - Telemedicina telexperticia" },
  { value: "09", label: "09 - Telemedicina telemonitoreo" },
];

export const grupoServiciosOptions = [
  { value: "01", label: "01 - Consulta externa" },
  { value: "02", label: "02 - Apoyo diagnóstico y complementación terapéutica" },
  { value: "03", label: "03 - Internación" },
  { value: "04", label: "04 - Quirúrgico" },
  { value: "05", label: "05 - Atención inmediata" },
];

export const tipoDiagnosticoPrincipalOptions = [
  { value: "01", label: "01 - Impresión diagnóstica" },
  { value: "02", label: "02 - Confirmado nuevo" },
  { value: "03", label: "03 - Confirmado repetido" },
];

export const conceptoRecaudoOptions = [
  { value: "01", label: "01 - Copago" },
  { value: "02", label: "02 - Cuota moderadora" },
  { value: "03", label: "03 - Pagos compartidos en planes voluntarios de salud" },
  { value: "05", label: "05 - No aplica" },
];

export const tipoNotaOptions = [
  { value: "", label: "Sin nota" },
  { value: "NA", label: "NA - Nota ajuste RIPS" },
  { value: "NC", label: "NC - Nota crédito" },
  { value: "ND", label: "ND - Nota débito" },
];

// DEPRECATED — these old lists are replaced by catalogs in src/data/attentionCatalogs.ts
export const finalidadOptions = [
  { value: "01", label: "01 - Impresión diagnóstica" },
  { value: "02", label: "02 - Confirmado nuevo" },
  { value: "03", label: "03 - Confirmado repetido" },
  { value: "05", label: "05 - No aplica" },
];

export const causaMotivoAtencionOptions = [
  { value: "38", label: "38 - Enfermedad general" },
];
