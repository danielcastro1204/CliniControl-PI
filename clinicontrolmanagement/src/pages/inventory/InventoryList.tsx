import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Eye, Pencil, Trash2, ArrowUpDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { removeProduct } from "@/store/inventoryStore";
import { InventoryCategory, ProductType, categoryLabels, ExpirationSemaphore } from "@/types/inventory";
import { Skeleton } from "@/components/ui/skeleton";

const semaforoColors = { verde: "bg-green-500", amarillo: "bg-yellow-400", rojo: "bg-red-500" };
const categoryFilters: { label: string; value: InventoryCategory | "all" }[] = [
  { label: "Todos", value: "all" },
  { label: "Dispositivos", value: "dispositivos" },
  { label: "Medicamentos", value: "medicamentos" },
  { label: "Insumos", value: "insumos" },
];

type SortField = "nombre" | "marca" | "stock" | "vencimiento";
type SortDir = "asc" | "desc";

interface ProductData {
  product: ProductType;
  stock: number;
  closestSemaphore: ExpirationSemaphore | null;
}

export default function InventoryList() {
  const navigate = useNavigate();
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<InventoryCategory | "all">("all");
  const [brandFilter, setBrandFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [alertFilter, setAlertFilter] = useState<ExpirationSemaphore | "all">("all");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [sortField, setSortField] = useState<SortField>("nombre");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const fetchData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_URL}/rest/v1/products/with-stock`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error fetching products with stock");
      const json = await res.json();
      setLowStockThreshold(json.low_stock_threshold ?? 5);
      const items = json.items || [];
      const data: ProductData[] = items.map((item: any) => ({
        product: item.product as ProductType,
        stock: item.stock ?? 0,
        closestSemaphore: item.closest_semaphore ?? null,
      }));
      setProductData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const brands = useMemo(() => [...new Set(productData.map(p => p.product.marca).filter(Boolean))].sort(), [productData]);
  const providers = useMemo(() => [...new Set(productData.map(p => p.product.proveedor).filter(Boolean))].sort(), [productData]);

  const filtered = useMemo(() => {
    return productData
      .filter(({ product: p, stock, closestSemaphore }) => {
        const matchCategory = filter === "all" || p.category === filter;
        const q = search.toLowerCase();
        const matchSearch = !q || p.descripcion.toLowerCase().includes(q) || p.marca.toLowerCase().includes(q) || p.proveedor.toLowerCase().includes(q);
        const matchBrand = !brandFilter || p.marca === brandFilter;
        const matchProvider = !providerFilter || p.proveedor === providerFilter;
        const matchAlert = alertFilter === "all" || closestSemaphore === alertFilter;
        const matchLowStock = !lowStockFilter || (stock > 0 && stock <= lowStockThreshold);
        return matchCategory && matchSearch && matchBrand && matchProvider && matchAlert && matchLowStock;
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        switch (sortField) {
          case "nombre": return dir * a.product.descripcion.localeCompare(b.product.descripcion);
          case "marca": return dir * a.product.marca.localeCompare(b.product.marca);
          case "stock": return dir * (a.stock - b.stock);
          default: return 0;
        }
      });
  }, [productData, search, filter, brandFilter, providerFilter, alertFilter, lowStockFilter, lowStockThreshold, sortField, sortDir]);

  const handleDelete = async (id: string) => {
    try {
      await removeProduct(id);
      setProductData(prev => prev.filter(p => p.product.id !== id));
    } catch (err) { console.error(err); }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const hasActiveFilters = brandFilter || providerFilter || alertFilter !== "all" || lowStockFilter;
  const clearFilters = () => { setBrandFilter(""); setProviderFilter(""); setAlertFilter("all"); setLowStockFilter(false); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary font-display">Inventario Clínico</h1>
          <p className="text-sm text-muted-foreground">Gestiona los productos de tu consultorio</p>
        </div>
        <Button onClick={() => navigate("/dashboard/inventario/nuevo")} className="gap-2"><Plus className="h-4 w-4" />Agregar producto</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, marca, proveedor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {categoryFilters.map(cf => (
            <Button key={cf.value} variant={filter === cf.value ? "default" : "outline"} size="sm" onClick={() => setFilter(cf.value)}>{cf.label}</Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={brandFilter || "__all__"} onValueChange={(v) => setBrandFilter(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Marca" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas las marcas</SelectItem>
            {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={providerFilter || "__all__"} onValueChange={(v) => setProviderFilter(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-[180px] h-8 text-xs"><SelectValue placeholder="Proveedor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los proveedores</SelectItem>
            {providers.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={alertFilter} onValueChange={(v) => setAlertFilter(v as ExpirationSemaphore | "all")}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Alerta" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las alertas</SelectItem>
            <SelectItem value="rojo">🔴 Crítico</SelectItem>
            <SelectItem value="amarillo">🟡 Próximo</SelectItem>
            <SelectItem value="verde">🟢 Vigente</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={lowStockFilter ? "default" : "outline"} size="sm" className="h-8 text-xs" onClick={() => setLowStockFilter(!lowStockFilter)}>Stock bajo (≤{lowStockThreshold})</Button>
        {hasActiveFilters && <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>Limpiar filtros</Button>}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("nombre")}>
                <span className="inline-flex items-center gap-1">Producto <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("marca")}>
                <span className="inline-flex items-center gap-1">Marca <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead>Presentación</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead className="text-center cursor-pointer select-none" onClick={() => toggleSort("stock")}>
                <span className="inline-flex items-center gap-1 justify-center">Stock total <ArrowUpDown className="h-3 w-3" /></span>
              </TableHead>
              <TableHead className="text-center">Alerta</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 8 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  {productData.length === 0 ? "No hay productos registrados. Comienza agregando uno." : "No se encontraron resultados."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(({ product, stock, closestSemaphore }) => (
                <TableRow key={product.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/dashboard/inventario/${product.id}`)}>
                  <TableCell className="font-medium">{product.descripcion}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-xs">{categoryLabels[product.category]}</Badge></TableCell>
                  <TableCell>{product.marca}</TableCell>
                  <TableCell className="max-w-[160px] truncate">{product.presentacionComercial}</TableCell>
                  <TableCell>{product.proveedor}</TableCell>
                  <TableCell className="text-center font-medium">{stock === 0 ? <span className="text-muted-foreground">—</span> : stock}</TableCell>
                  <TableCell className="text-center">
                    {closestSemaphore ? (
                      <span className={`inline-block h-3 w-3 rounded-full ${semaforoColors[closestSemaphore]}`} />
                    ) : (
                      <span className="text-muted-foreground text-xs">Sin stock</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/inventario/${product.id}`)} title="Ver"><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/dashboard/inventario/${product.id}/editar`)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" title="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
                            <AlertDialogDescription>Se eliminará "{product.descripcion}" y todo su stock permanentemente.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(product.id)}>Eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
