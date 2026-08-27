import { api } from "@/integrations/api";
import {
  ProductType, ProductInstance, InventoryCategory,
  StatusSemaphore,
} from "@/types/inventory";

// ── Map DB → app types ──────────────────────────────────────────

function toProduct(row: any): ProductType {
  const base = {
    id: row.id,
    descripcion: row.descripcion,
    marca: row.marca,
    presentacionComercial: row.presentacion_comercial,
    registroSanitario: row.registro_sanitario,
    precioUnitario: Number(row.precio_unitario) || 0,
    proveedor: row.proveedor,
    observaciones: row.observaciones,
  };

  if (row.category === "dispositivos") {
    return { ...base, category: "dispositivos", serie: row.serie || "", clasificacionRiesgo: row.clasificacion_riesgo || "", vidaUtil: row.vida_util || "", almacenamiento: row.almacenamiento || "" };
  } else if (row.category === "medicamentos") {
    return { ...base, category: "medicamentos", principioActivo: row.principio_activo || "", formaFarmaceutica: row.forma_farmaceutica || "", concentracion: row.concentracion || "", unidadMedida: row.unidad_medida || "" };
  } else {
    return { ...base, category: "insumos", vidaUtil: row.vida_util || "" };
  }
}

function toInstance(row: any): ProductInstance {
  return {
    id: row.id,
    productId: row.product_id,
    lote: row.lote,
    fechaRegistro: row.fecha_registro,
    fechaVencimiento: row.fecha_vencimiento,
    cantidad: row.cantidad,
    diasDisponibilidad: row.dias_disponibilidad,
    fechaSalida: row.fecha_salida,
    estado: row.estado as StatusSemaphore,
    semaforizacion: row.semaforizacion as any,
    observaciones: row.observaciones,
  };
}

// ── Products CRUD ───────────────────────────────────────────────

export async function getAllProducts(): Promise<ProductType[]> {
  const { data, error } = await api.from("products").select("*").order("descripcion").execute();
  if (error) throw error;
  return (data || []).map(toProduct);
}

export async function getProductById(id: string): Promise<ProductType | null> {
  const { data, error } = await api.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toProduct(data) : null;
}

export async function createProduct(clinicId: string, product: Omit<ProductType, "id">): Promise<ProductType> {
  const payload: Record<string, unknown> = {
    clinic_id: clinicId,
    category: product.category,
    descripcion: product.descripcion,
    marca: product.marca,
    presentacion_comercial: product.presentacionComercial,
    registro_sanitario: product.registroSanitario,
    precio_unitario: product.precioUnitario,
    proveedor: product.proveedor,
    observaciones: product.observaciones,
  };

  if (product.category === "dispositivos") {
    payload.serie = (product as any).serie;
    payload.clasificacion_riesgo = (product as any).clasificacionRiesgo;
    payload.vida_util = (product as any).vidaUtil;
    payload.almacenamiento = (product as any).almacenamiento;
  } else if (product.category === "medicamentos") {
    payload.principio_activo = (product as any).principioActivo;
    payload.forma_farmaceutica = (product as any).formaFarmaceutica;
    payload.concentracion = (product as any).concentracion;
    payload.unidad_medida = (product as any).unidadMedida;
  } else if (product.category === "insumos") {
    payload.vida_util = (product as any).vidaUtil;
  }

  const { data, error } = await api.from("products").insert(payload as any).select().single();
  if (error) throw error;
  return toProduct(data);
}

export async function updateProduct(id: string, updates: Partial<ProductType>): Promise<ProductType | null> {
  const payload: Record<string, unknown> = {};
  if (updates.descripcion !== undefined) payload.descripcion = updates.descripcion;
  if (updates.marca !== undefined) payload.marca = updates.marca;
  if ((updates as any).presentacionComercial !== undefined) payload.presentacion_comercial = (updates as any).presentacionComercial;
  if ((updates as any).registroSanitario !== undefined) payload.registro_sanitario = (updates as any).registroSanitario;
  if ((updates as any).precioUnitario !== undefined) payload.precio_unitario = (updates as any).precioUnitario;
  if (updates.proveedor !== undefined) payload.proveedor = updates.proveedor;
  if (updates.observaciones !== undefined) payload.observaciones = updates.observaciones;
  if ((updates as any).serie !== undefined) payload.serie = (updates as any).serie;
  if ((updates as any).clasificacionRiesgo !== undefined) payload.clasificacion_riesgo = (updates as any).clasificacionRiesgo;
  if ((updates as any).vidaUtil !== undefined) payload.vida_util = (updates as any).vidaUtil;
  if ((updates as any).almacenamiento !== undefined) payload.almacenamiento = (updates as any).almacenamiento;
  if ((updates as any).principioActivo !== undefined) payload.principio_activo = (updates as any).principioActivo;
  if ((updates as any).formaFarmaceutica !== undefined) payload.forma_farmaceutica = (updates as any).formaFarmaceutica;
  if ((updates as any).concentracion !== undefined) payload.concentracion = (updates as any).concentracion;
  if ((updates as any).unidadMedida !== undefined) payload.unidad_medida = (updates as any).unidadMedida;

  const { data, error } = await api.from("products").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data ? toProduct(data) : null;
}

export async function removeProduct(id: string): Promise<boolean> {
  const { error } = await api.from("products").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ── Instances CRUD ──────────────────────────────────────────────

export async function getInstancesByProduct(productId: string): Promise<ProductInstance[]> {
  const { data, error } = await api.from("product_instances").select("*").eq("product_id", productId).order("fecha_vencimiento").execute();
  if (error) throw error;
  return (data || []).map(toInstance);
}

export async function getAllInstances(): Promise<ProductInstance[]> {
  const { data, error } = await api.from("product_instances").select("*").order("fecha_vencimiento").execute();
  if (error) throw error;
  return (data || []).map(toInstance);
}

export async function getInstanceById(id: string): Promise<ProductInstance | null> {
  const { data, error } = await api.from("product_instances").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toInstance(data) : null;
}

export async function addStock(
  clinicId: string,
  productId: string,
  lote: string,
  fechaRegistro: string,
  fechaVencimiento: string,
  cantidad: number,
  estado: StatusSemaphore = "almacenado"
): Promise<ProductInstance> {
  // Backend computes diasDisponibilidad and semaforizacion
  const { data, error } = await api
    .from("product_instances")
    .insert({
      clinic_id: clinicId,
      product_id: productId,
      lote,
      fecha_registro: fechaRegistro,
      fecha_vencimiento: fechaVencimiento,
      cantidad,
      estado,
      observaciones: "",
    })
    .select()
    .single();
  if (error) throw error;
  return toInstance(data);
}

export async function updateInstance(id: string, updates: Partial<ProductInstance>): Promise<ProductInstance | null> {
  // Backend recalculates semaforizacion and diasDisponibilidad automatically
  const payload: Record<string, unknown> = {};
  if (updates.lote !== undefined) payload.lote = updates.lote;
  if (updates.fechaRegistro !== undefined) payload.fecha_registro = updates.fechaRegistro;
  if (updates.fechaVencimiento !== undefined) payload.fecha_vencimiento = updates.fechaVencimiento;
  if (updates.cantidad !== undefined) payload.cantidad = updates.cantidad;
  if (updates.estado !== undefined) payload.estado = updates.estado;
  if (updates.observaciones !== undefined) payload.observaciones = updates.observaciones;
  if (updates.fechaSalida !== undefined) payload.fecha_salida = updates.fechaSalida;

  const { data, error } = await api.from("product_instances").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return data ? toInstance(data) : null;
}

export async function removeInstance(id: string): Promise<boolean> {
  const { error } = await api.from("product_instances").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export interface InventoryMovement {
  id: string;
  clinic_id: string;
  product_id: string;
  instance_id: string;
  cantidad: number;
  lote: string;
  fecha_uso: string;
  user_id: string;
  user_name: string;
  patient_id: string | null;
  patient_name: string;
  tipo_movimiento: string;
  observaciones: string;
  created_at: string;
}

export async function consumeStock(
  instanceId: string,
  qty: number,
  opts?: { clinicId: string; userId: string; userName: string; productId: string; lote: string; patientId?: string; patientName?: string; observaciones?: string }
): Promise<{ success: boolean; instance?: ProductInstance; error?: string }> {
  if (!opts) return { success: false, error: "Missing required options" };

  // Single atomic call — backend validates stock, decrements instance, creates movement
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
  const token = localStorage.getItem("auth_token");
  const response = await fetch(`${API_URL}/rest/v1/inventory_movements/consume`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      instance_id: instanceId,
      product_id: opts.productId,
      cantidad: qty,
      lote: opts.lote,
      user_name: opts.userName,
      patient_id: opts.patientId || null,
      patient_name: opts.patientName || "",
      observaciones: opts.observaciones || "",
    }),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    return { success: false, error: result.error || "Error al consumir stock" };
  }
  return { success: true, instance: result.instance ? toInstance(result.instance) : undefined };
}

// ── Movements (history) ─────────────────────────────────────────

export async function getMovementsByProduct(productId: string): Promise<InventoryMovement[]> {
  const { data, error } = await api
    .from("inventory_movements")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as InventoryMovement[];
}

// ── Aggregates ──────────────────────────────────────────────────

export async function getTotalStock(productId: string): Promise<number> {
  const instances = await getInstancesByProduct(productId);
  return instances.reduce((sum, i) => sum + i.cantidad, 0);
}

export async function getClosestExpiration(productId: string): Promise<ProductInstance | null> {
  const instances = await getInstancesByProduct(productId);
  const active = instances.filter(i => i.fechaVencimiento && i.cantidad > 0);
  if (!active.length) return null;
  return active.sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())[0];
}
