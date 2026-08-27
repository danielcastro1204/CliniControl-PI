export type InventoryCategory = "dispositivos" | "medicamentos" | "insumos";

export type ExpirationSemaphore = "verde" | "amarillo" | "rojo";
export type StatusSemaphore = "usado" | "en_uso" | "almacenado";

// ── Product Type (catalog) ──────────────────────────────────────

export interface ProductTypeBase {
  id: string;
  category: InventoryCategory;
  descripcion: string;
  marca: string;
  presentacionComercial: string;
  registroSanitario: string;
  precioUnitario: number;
  proveedor: string;
  observaciones: string;
}

export interface DispositivoMedico extends ProductTypeBase {
  category: "dispositivos";
  serie: string;
  clasificacionRiesgo: string;
  vidaUtil: string;
  almacenamiento: string;
}

export interface Medicamento extends ProductTypeBase {
  category: "medicamentos";
  principioActivo: string;
  formaFarmaceutica: string;
  concentracion: string;
  unidadMedida: string;
}

export interface Insumo extends ProductTypeBase {
  category: "insumos";
  vidaUtil: string;
}

export type ProductType = DispositivoMedico | Medicamento | Insumo;

// ── Product Instance (stock entry) ──────────────────────────────

export interface ProductInstance {
  id: string;
  productId: string;
  lote: string;
  fechaRegistro: string;
  fechaVencimiento: string;
  cantidad: number;
  diasDisponibilidad: number;
  fechaSalida: string;
  estado: StatusSemaphore;
  semaforizacion: ExpirationSemaphore;
  observaciones: string;
}

// ── Labels ──────────────────────────────────────────────────────

export const categoryLabels: Record<InventoryCategory, string> = {
  dispositivos: "Dispositivos Médicos",
  medicamentos: "Medicamentos",
  insumos: "Insumos",
};

export const statusLabels: Record<StatusSemaphore, string> = {
  usado: "Usado",
  en_uso: "En uso",
  almacenado: "Almacenado",
};

export const expirationLabels: Record<ExpirationSemaphore, string> = {
  verde: "Vigente (>12 meses)",
  amarillo: "Próximo a vencer (3-12 meses)",
  rojo: "Crítico (<3 meses)",
};
