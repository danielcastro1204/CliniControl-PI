import { api } from "@/integrations/api";

export interface PatientRow {
  id: string;
  clinic_id: string;
  nombres: string;
  primer_apellido: string;
  segundo_apellido: string;
  estado_tratamiento: string;
  tipo_documento_identificacion: string;
  num_documento_identificacion: string;
  tipo_usuario: string;
  fecha_nacimiento: string;
  cod_sexo: string;
  cod_pais_residencia: string;
  cod_municipio_residencia: string;
  cod_zona_territorial_residencia: string;
  incapacidad: string;
  cod_pais_origen: string;
}

// Map DB row → legacy Patient shape used by components
function toPatient(row: PatientRow) {
  return {
    id: row.id,
    nombres: row.nombres,
    primerApellido: row.primer_apellido,
    segundoApellido: row.segundo_apellido,
    estadoTratamiento: row.estado_tratamiento as "en_tratamiento" | "finalizado",
    tipoDocumentoIdentificacion: row.tipo_documento_identificacion,
    numDocumentoIdentificacion: row.num_documento_identificacion,
    tipoUsuario: row.tipo_usuario,
    fechaNacimiento: row.fecha_nacimiento,
    codSexo: row.cod_sexo,
    codPaisResidencia: row.cod_pais_residencia,
    codMunicipioResidencia: row.cod_municipio_residencia,
    codZonaTerritorialResidencia: row.cod_zona_territorial_residencia,
    incapacidad: row.incapacidad,
    codPaisOrigen: row.cod_pais_origen,
  };
}

export type Patient = ReturnType<typeof toPatient>;

export async function getAllPatients(): Promise<Patient[]> {
  const { data, error } = await api
    .from("patients")
    .select("*")
    .order("primer_apellido")
    .execute();
  if (error) throw error;
  return (data || []).map(toPatient);
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const { data, error } = await api
    .from("patients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toPatient(data) : null;
}

export async function addPatient(
  clinicId: string,
  patient: Omit<Patient, "id">
): Promise<Patient> {
  const { data, error } = await api
    .from("patients")
    .insert({
      clinic_id: clinicId,
      nombres: patient.nombres,
      primer_apellido: patient.primerApellido,
      segundo_apellido: patient.segundoApellido,
      estado_tratamiento: patient.estadoTratamiento,
      tipo_documento_identificacion: patient.tipoDocumentoIdentificacion,
      num_documento_identificacion: patient.numDocumentoIdentificacion,
      tipo_usuario: patient.tipoUsuario,
      fecha_nacimiento: patient.fechaNacimiento,
      cod_sexo: patient.codSexo,
      cod_pais_residencia: patient.codPaisResidencia,
      cod_municipio_residencia: patient.codMunicipioResidencia,
      cod_zona_territorial_residencia: patient.codZonaTerritorialResidencia,
      incapacidad: patient.incapacidad,
      cod_pais_origen: patient.codPaisOrigen,
    })
    .select()
    .single();
  if (error) {
    throw error;
  }
  return toPatient(data);
}

export async function updatePatient(
  id: string,
  patient: Partial<Patient>
): Promise<Patient> {
  const payload: Record<string, unknown> = {};
  if (patient.nombres !== undefined) payload.nombres = patient.nombres;
  if (patient.primerApellido !== undefined) payload.primer_apellido = patient.primerApellido;
  if (patient.segundoApellido !== undefined) payload.segundo_apellido = patient.segundoApellido;
  if (patient.estadoTratamiento !== undefined) payload.estado_tratamiento = patient.estadoTratamiento;
  if (patient.tipoDocumentoIdentificacion !== undefined) payload.tipo_documento_identificacion = patient.tipoDocumentoIdentificacion;
  if (patient.numDocumentoIdentificacion !== undefined) payload.num_documento_identificacion = patient.numDocumentoIdentificacion;
  if (patient.tipoUsuario !== undefined) payload.tipo_usuario = patient.tipoUsuario;
  if (patient.fechaNacimiento !== undefined) payload.fecha_nacimiento = patient.fechaNacimiento;
  if (patient.codSexo !== undefined) payload.cod_sexo = patient.codSexo;
  if (patient.codPaisResidencia !== undefined) payload.cod_pais_residencia = patient.codPaisResidencia;
  if (patient.codMunicipioResidencia !== undefined) payload.cod_municipio_residencia = patient.codMunicipioResidencia;
  if (patient.codZonaTerritorialResidencia !== undefined) payload.cod_zona_territorial_residencia = patient.codZonaTerritorialResidencia;
  if (patient.incapacidad !== undefined) payload.incapacidad = patient.incapacidad;
  if (patient.codPaisOrigen !== undefined) payload.cod_pais_origen = patient.codPaisOrigen;

  const { data, error } = await api
    .from("patients")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return toPatient(data);
}

export async function removePatient(id: string): Promise<void> {
  const { error } = await api.from("patients").delete().eq("id", id);
  if (error) throw error;
}
