import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createProduct, getProductById, updateProduct } from "@/store/inventoryStore";
import { InventoryCategory, categoryLabels } from "@/types/inventory";
import { useAuth } from "@/contexts/AuthContext";

const defaultBase = {
  descripcion: "", marca: "", presentacionComercial: "",
  registroSanitario: "", precioUnitario: 0,
  proveedor: "", observaciones: "",
};

export default function InventoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isEdit = !!id;

  const [category, setCategory] = useState<InventoryCategory | "">("");
  const [formData, setFormData] = useState<Record<string, any>>({ ...defaultBase });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      getProductById(id).then(item => {
        if (item) {
          setCategory(item.category);
          setFormData({ ...item });
        } else {
          navigate("/dashboard/inventario");
        }
        setLoading(false);
      });
    }
  }, [id, isEdit, navigate]);

  const set = (key: string, value: any) => setFormData((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Backend enforces all validation (category, descripcion, precio >= 0)
    if (!profile?.clinic_id) { toast.error("No se pudo determinar el consultorio"); return; }

    setSaving(true);
    try {
      const payload = { ...formData, category } as any;
      if (isEdit && id) {
        await updateProduct(id, payload);
        toast.success("Producto actualizado");
      } else {
        await createProduct(profile.clinic_id, payload);
        toast.success("Producto creado");
      }
      navigate("/dashboard/inventario");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-16 text-muted-foreground">Cargando...</div>;

  const renderField = (label: string, key: string, type = "text", required = false) => (
    <div className="space-y-1.5" key={key}>
      <Label htmlFor={key}>{label}{required && " *"}</Label>
      {type === "textarea" ? (
        <Textarea id={key} value={formData[key] || ""} onChange={(e) => set(key, e.target.value)} />
      ) : (
        <Input id={key} type={type} value={formData[key] ?? ""} onChange={(e) => set(key, type === "number" ? Number(e.target.value) : e.target.value)} />
      )}
    </div>
  );

  const commonFields = [
    { label: "Descripción", key: "descripcion", type: "text", required: true },
    { label: "Marca", key: "marca" },
    { label: "Presentación comercial", key: "presentacionComercial" },
    { label: "Registro sanitario", key: "registroSanitario" },
    { label: "Precio unitario", key: "precioUnitario", type: "number" },
    { label: "Proveedor", key: "proveedor" },
  ];

  const categorySpecificFields: Record<InventoryCategory, { label: string; key: string; type?: string }[]> = {
    dispositivos: [
      { label: "Serie", key: "serie" },
      { label: "Clasificación por riesgo", key: "clasificacionRiesgo" },
      { label: "Vida útil", key: "vidaUtil" },
      { label: "Almacenamiento", key: "almacenamiento" },
    ],
    medicamentos: [
      { label: "Principio activo", key: "principioActivo" },
      { label: "Forma farmacéutica", key: "formaFarmaceutica" },
      { label: "Concentración", key: "concentracion" },
      { label: "Unidad de medida", key: "unidadMedida" },
    ],
    insumos: [{ label: "Vida útil", key: "vidaUtil" }],
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/inventario")}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold text-secondary font-display">{isEdit ? "Editar producto" : "Nuevo producto"}</h1>
      </div>

      {!isEdit && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Tipo de producto</CardTitle></CardHeader>
          <CardContent>
            <Select value={category} onValueChange={(v) => setCategory(v as InventoryCategory)}>
              <SelectTrigger className="max-w-xs"><SelectValue placeholder="Selecciona el tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dispositivos">{categoryLabels.dispositivos}</SelectItem>
                <SelectItem value="medicamentos">{categoryLabels.medicamentos}</SelectItem>
                <SelectItem value="insumos">{categoryLabels.insumos}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {category && (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader><CardTitle className="text-lg">{isEdit ? "Datos del producto" : categoryLabels[category]}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {commonFields.map(f => renderField(f.label, f.key, f.type || "text", f.required))}
                {categorySpecificFields[category].map(f => renderField(f.label, f.key, f.type || "text"))}
                {renderField("Observaciones", "observaciones", "textarea")}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => navigate("/dashboard/inventario")}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}</Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
