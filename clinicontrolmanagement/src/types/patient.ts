export interface Patient {
  id: string;
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

export const estadoTratamientoOptions = [
  { value: "en_tratamiento", label: "En tratamiento" },
  { value: "finalizado", label: "Finalizado" },
];

export const tipoDocumentoOptions = [
  { value: "CN", label: "CN - Certificado de nacido vivo" },
  { value: "RC", label: "RC - Registro civil" },
  { value: "TI", label: "TI - Tarjeta de Identidad" },
  { value: "CC", label: "CC - Cédula de Ciudadanía" },
  { value: "CE", label: "CE - Cédula de Extranjería" },
  { value: "PA", label: "PA - Pasaporte" },
  { value: "DE", label: "DE - Documento extranjero" },
  { value: "CD", label: "CD - Carné Diplomático" },
  { value: "SC", label: "SC - Salvoconducto" },
  { value: "PE", label: "PE - Permiso Especial de Permanencia" },
  { value: "PT", label: "PT - Permiso por protección temporal" },
  { value: "MS", label: "MS - Menor sin identificación" },
  { value: "AS", label: "AS - Adulto sin identificación" },
  { value: "SI", label: "SI - Sin identificación" },
];

export const tipoUsuarioOptions = [
  { value: "01", label: "01 - Contributivo cotizante" },
  { value: "02", label: "02 - Contributivo beneficiario" },
  { value: "03", label: "03 - Contributivo adicional" },
  { value: "04", label: "04 - Subsidiado" },
  { value: "05", label: "05 - No afiliado" },
  { value: "06", label: "06 - Especial o Excepción cotizante" },
  { value: "07", label: "07 - Especial o Excepción beneficiario" },
  { value: "08", label: "08 - Personas privadas de la libertad a cargo del FNS" },
  { value: "09", label: "09 - Tomador / Amparado ARL" },
  { value: "10", label: "10 - Tomador / Amparado SOAT" },
  { value: "11", label: "11 - Tomador / Amparado Planes voluntarios de salud" },
  { value: "12", label: "12 - Particular" },
];

export const codSexoOptions = [
  { value: "M", label: "M - Masculino" },
  { value: "F", label: "F - Femenino" },
  { value: "I", label: "I - Indeterminado o Intersexual" },
];

export const zonaTerritorialOptions = [
  { value: "01", label: "01 - Rural" },
  { value: "02", label: "02 - Urbano" },
];

export const incapacidadOptions = [
  { value: "Si", label: "Sí" },
  { value: "No", label: "No" },
];

// Re-export complete lists from data files
import { fullPaisOptions } from "@/data/countries";
import { fullMunicipioOptions } from "@/data/municipalities";
export const paisOptions = fullPaisOptions;
export const municipioOptions = fullMunicipioOptions;

export function getTipoDocLabel(value: string): string {
  return tipoDocumentoOptions.find(o => o.value === value)?.label ?? value;
}

export function getTipoUsuarioLabel(value: string): string {
  return tipoUsuarioOptions.find(o => o.value === value)?.label ?? value;
}

export function getSexoLabel(value: string): string {
  return codSexoOptions.find(o => o.value === value)?.label ?? value;
}

export function getPaisLabel(value: string): string {
  return paisOptions.find(o => o.value === value)?.label ?? value;
}

export function getMunicipioLabel(value: string): string {
  return municipioOptions.find(o => o.value === value)?.label ?? value;
}

export function getZonaLabel(value: string): string {
  return zonaTerritorialOptions.find(o => o.value === value)?.label ?? value;
}
