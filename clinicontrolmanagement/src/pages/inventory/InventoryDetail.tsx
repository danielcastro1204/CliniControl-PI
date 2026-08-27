import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pencil, Plus, Minus, Trash2, ArrowUpDown, Filter, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getProductById, getInstancesByProduct, addStock, consumeStock, updateInstance, removeInstance, getMovementsByProduct, InventoryMovement } from "@/store/inventoryStore";
import { useAuth } from "@/contexts/AuthContext";
import { categoryLabels, expirationLabels, statusLabels, ProductType, ProductInstance, StatusSemaphore, ExpirationSemaphore } from "@/types/inventory";
import { api } from "@/integrations/api";

const semaforoColor = { verde: "bg-green-500", amarillo: "bg-yellow-400", rojo: "bg-red-500" };
const statusDot: Record<StatusSemaphore, string> = { usado: "bg-sky-400", en_uso: "bg-purple-400", almacenado: "bg-gray-200 border border-gray-300" };

type InstanceSortField = "vencimiento" | "dias" | "cantidad";
type SortDir = "asc" | "desc";

export default function InventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [product, setProduct] = useState<ProductType | null>(null);
  const [instances, setInstances] = useState<ProductInstance[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const [instLoteFilter, setInstLoteFilter] = useState("");
  const [instStatusFilter, setInstStatusFilter] = useState<StatusSemaphore | "all">("all");
  const [instAlertFilter, setInstAlertFilter] = useState<ExpirationSemaphore | "all">("all");
  const [instSortField, setInstSortField] = useState<InstanceSortField>("vencimiento");
  const [instSortDir, setInstSortDir] = useState<SortDir>("asc");

  const [addOpen, setAddOpen] = useState(false);
  const [newLote, setNewLote] = useState("");
  const [newFechaRegistro, setNewFechaRegistro] = useState(new Date().toISOString().split("T")[0]);
  const [newFechaVenc, setNewFechaVenc] = useState("");
  const [newCantidad, setNewCantidad] = useState(1);

  const [consumeOpen, setConsumeOpen] = useState(false);
  const [consumeInstanceId, setConsumeInstanceId] = useState("");
  const [consumeQty, setConsumeQty] = useState(1);
  const [consumePatientId, setConsumePatientId] = useState("");
  const [consumePatientName, setConsumePatientName] = useState("");
  const [consumeObservaciones, setConsumeObservaciones] = useState("");
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editInstance, setEditInstance] = useState<ProductInstance | null>(null);
  const [editLote, setEditLote] = useState("");
  const [editFechaRegistro, setEditFechaRegistro] = useState("");
  const [editFecha, setEditFecha] = useState("");
  const [editEstado, setEditEstado] = useState<StatusSemaphore>("almacenado");
  const [editObservaciones, setEditObservaciones] = useState("");

  const refresh = useCallback(async () => {
    if (id) {
      const [insts, movs] = await Promise.all([getInstancesByProduct(id), getMovementsByProduct(id)]);
      setInstances(insts);
      setMovements(movs);
    }
  }, [id]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const [p, insts, movs] = await Promise.all([getProductById(id), getInstancesByProduct(id), getMovementsByProduct(id)]);
        setProduct(p);
        setInstances(insts);
        setMovements(movs);
        // Load patients for consume dialog
        const { data: pats } = await api.from("patients").select("id, nombres, primer_apellido").order("nombres").execute();
        setPatients((pats || []).map(p => ({ id: p.id, name: `${p.nombres} ${p.primer_apellido}` })));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const filteredInstances = useMemo(() => {
    return instances
      .filter(inst => {
        const matchLote = !instLoteFilter || inst.lote.toLowerCase().includes(instLoteFilter.toLowerCase());
        const matchStatus = instStatusFilter === "all" || inst.estado === instStatusFilter;
        const matchAlert = instAlertFilter === "all" || inst.semaforizacion === instAlertFilter;
        return matchLote && matchStatus && matchAlert;
      })
      .sort((a, b) => {
        const dir = instSortDir === "asc" ? 1 : -1;
        switch (instSortField) {
          case "vencimiento": return dir * (new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime());
          case "dias": return dir * (a.diasDisponibilidad - b.diasDisponibilidad);
          case "cantidad": return dir * (a.cantidad - b.cantidad);
          default: return 0;
        }
      });
  }, [instances, instLoteFilter, instStatusFilter, instAlertFilter, instSortField, instSortDir]);

  const toggleInstSort = (field: InstanceSortField) => {
    if (instSortField === field) setInstSortDir(d => d === "asc" ? "desc" : "asc");
    else { setInstSortField(field); setInstSortDir("asc"); }
  };

  if (loading) return <div className="space-y-6"><Skeleton className="h-8 w-64" /><Skeleton className="h-40 w-full" /></div>;

  if (!product) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Producto no encontrado.<br />
        <Button variant="link" onClick={() => navigate("/dashboard/inventario")}>Volver al inventario</Button>
      </div>
    );
  }

  const totalStock = instances.reduce((s, i) => s + i.cantidad, 0);

  const fields: { label: string; value: any }[] = [
    { label: "Descripción", value: product.descripcion },
    { label: "Tipo", value: categoryLabels[product.category] },
    { label: "Marca", value: product.marca },
    { label: "Presentación comercial", value: product.presentacionComercial },
    { label: "Registro sanitario", value: product.registroSanitario },
    { label: "Precio unitario", value: product.precioUnitario ? `$${product.precioUnitario.toLocaleString()}` : "—" },
    { label: "Proveedor", value: product.proveedor },
    { label: "Stock total", value: totalStock },
    { label: "Observaciones", value: product.observaciones || "—" },
  ];

  if (product.category === "dispositivos") {
    fields.push({ label: "Serie", value: (product as any).serie }, { label: "Clasificación por riesgo", value: (product as any).clasificacionRiesgo }, { label: "Vida útil", value: (product as any).vidaUtil }, { label: "Almacenamiento", value: (product as any).almacenamiento });
  } else if (product.category === "medicamentos") {
    fields.push({ label: "Principio activo", value: (product as any).principioActivo }, { label: "Forma farmacéutica", value: (product as any).formaFarmaceutica }, { label: "Concentración", value: (product as any).concentracion }, { label: "Unidad de medida", value: (product as any).unidadMedida });
  } else if (product.category === "insumos") {
    fields.push({ label: "Vida útil", value: (product as any).vidaUtil });
  }

  const handleAddStock = async () => {
    if (!newLote || !newFechaVenc || !newFechaRegistro || newCantidad <= 0) { toast.error("Completa todos los campos"); return; }
    if (!profile?.clinic_id) { toast.error("No se pudo determinar el consultorio"); return; }
    await addStock(profile.clinic_id, product.id, newLote, newFechaRegistro, newFechaVenc, newCantidad);
    toast.success("Existencia agregada");
    setAddOpen(false); setNewLote(""); setNewFechaRegistro(new Date().toISOString().split("T")[0]); setNewFechaVenc(""); setNewCantidad(1);
    refresh();
  };

  const handleConsume = async () => {
    if (!consumeInstanceId || consumeQty <= 0) { toast.error("Selecciona una instancia y cantidad válida"); return; }
    const selectedInst = activeInstances.find(i => i.id === consumeInstanceId);
    const result = await consumeStock(consumeInstanceId, consumeQty, {
      clinicId: profile?.clinic_id || "",
      userId: user?.id || "",
      userName: `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim(),
      productId: product.id,
      lote: selectedInst?.lote || "",
      patientId: consumePatientId || undefined,
      patientName: consumePatientName,
      observaciones: consumeObservaciones,
    });
    if (!result.success) { toast.error(result.error || "Error"); return; }
    toast.success("Uso registrado");
    setConsumeOpen(false); setConsumeInstanceId(""); setConsumeQty(1); setConsumePatientId(""); setConsumePatientName(""); setConsumeObservaciones("");
    refresh();
  };

  const handleEditOpen = (inst: ProductInstance) => {
    setEditInstance(inst); setEditLote(inst.lote); setEditFechaRegistro(inst.fechaRegistro);
    setEditFecha(inst.fechaVencimiento); setEditEstado(inst.estado); setEditObservaciones(inst.observaciones || "");
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editInstance) return;
    await updateInstance(editInstance.id, { lote: editLote, fechaRegistro: editFechaRegistro, fechaVencimiento: editFecha, estado: editEstado, observaciones: editObservaciones });
    toast.success("Instancia actualizada"); setEditOpen(false); refresh();
  };

  const handleDeleteInstance = async (instId: string) => {
    await removeInstance(instId);
    toast.success("Instancia eliminada"); refresh();
  };

  const activeInstances = instances.filter(i => i.cantidad > 0);
  const selectedConsumeInstance = activeInstances.find(i => i.id === consumeInstanceId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/inventario")}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-secondary font-display">{product.descripcion}</h1>
            <div className="flex items-center gap-2 mt-1"><Badge variant="secondary">{categoryLabels[product.category]}</Badge><span className="text-sm text-muted-foreground">Stock total: {totalStock}</span></div>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(`/dashboard/inventario/${product.id}/editar`)} className="gap-2"><Pencil className="h-4 w-4" /> Editar producto</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Información del producto</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
            {fields.map(f => (<div key={f.label}><dt className="text-xs text-muted-foreground uppercase tracking-wide">{f.label}</dt><dd className="mt-0.5 text-sm font-medium text-foreground">{f.value || "—"}</dd></div>))}
          </dl>
        </CardContent>
      </Card>

      <Tabs defaultValue="existencias">
        <TabsList>
          <TabsTrigger value="existencias" className="gap-1.5"><Plus className="h-4 w-4" /> Existencias</TabsTrigger>
          <TabsTrigger value="historial" className="gap-1.5"><History className="h-4 w-4" /> Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="existencias">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Existencias (Lotes)</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5"><Plus className="h-4 w-4" /> Agregar existencia</Button>
                <Button size="sm" variant="outline" onClick={() => setConsumeOpen(true)} className="gap-1.5" disabled={activeInstances.length === 0}><Minus className="h-4 w-4" /> Registrar uso</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-500" />Vigente (&gt;12 meses)</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />Próximo (3-12 meses)</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Crítico (&lt;3 meses)</div>
                <span className="text-border">|</span>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sky-400" />Usado</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-purple-400" />En uso</div>
                <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-gray-200 border border-gray-300" />Almacenado</div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Input placeholder="Filtrar por lote..." value={instLoteFilter} onChange={e => setInstLoteFilter(e.target.value)} className="w-[160px] h-8 text-xs" />
                <Select value={instStatusFilter} onValueChange={v => setInstStatusFilter(v as StatusSemaphore | "all")}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="almacenado">⚪ Almacenado</SelectItem>
                    <SelectItem value="en_uso">🟣 En uso</SelectItem>
                    <SelectItem value="usado">🔵 Usado</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={instAlertFilter} onValueChange={v => setInstAlertFilter(v as ExpirationSemaphore | "all")}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Vencimiento" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="rojo">🔴 Crítico</SelectItem>
                    <SelectItem value="amarillo">🟡 Próximo</SelectItem>
                    <SelectItem value="verde">🟢 Vigente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lote</TableHead>
                      <TableHead>Fecha registro</TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => toggleInstSort("vencimiento")}>
                        <span className="inline-flex items-center gap-1">Fecha vencimiento <ArrowUpDown className="h-3 w-3" /></span>
                      </TableHead>
                      <TableHead className="text-center cursor-pointer select-none" onClick={() => toggleInstSort("dias")}>
                        <span className="inline-flex items-center gap-1 justify-center">Días disp. <ArrowUpDown className="h-3 w-3" /></span>
                      </TableHead>
                      <TableHead className="text-center cursor-pointer select-none" onClick={() => toggleInstSort("cantidad")}>
                        <span className="inline-flex items-center gap-1 justify-center">Cantidad <ArrowUpDown className="h-3 w-3" /></span>
                      </TableHead>
                      <TableHead className="text-center">Vencimiento</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInstances.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No hay existencias registradas.</TableCell></TableRow>
                    ) : (
                      filteredInstances.map(inst => (
                        <TableRow key={inst.id}>
                          <TableCell className="font-medium">{inst.lote}</TableCell>
                          <TableCell>{inst.fechaRegistro || "—"}</TableCell>
                          <TableCell>{inst.fechaVencimiento || "—"}</TableCell>
                          <TableCell className="text-center text-sm">{inst.diasDisponibilidad}</TableCell>
                          <TableCell className="text-center font-medium">{inst.cantidad}</TableCell>
                          <TableCell className="text-center"><span className={`inline-block h-3 w-3 rounded-full ${semaforoColor[inst.semaforizacion]}`} title={expirationLabels[inst.semaforizacion]} /></TableCell>
                          <TableCell className="text-center"><div className="flex items-center justify-center gap-1.5"><span className={`inline-block h-3 w-3 rounded-full ${statusDot[inst.estado]}`} /><span className="text-xs">{statusLabels[inst.estado]}</span></div></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => handleEditOpen(inst)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" title="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>¿Eliminar esta existencia?</AlertDialogTitle><AlertDialogDescription>Se eliminará el lote "{inst.lote}" permanentemente.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteInstance(inst.id)}>Eliminar</AlertDialogAction></AlertDialogFooter>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5 text-primary" /> Historial de consumos</CardTitle>
            </CardHeader>
            <CardContent>
              {movements.length === 0 ? (
                <p className="text-center py-10 text-muted-foreground">No se han registrado consumos para este producto.</p>
              ) : (
                <div className="rounded-lg border border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha de uso</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Observaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map(m => (
                        <TableRow key={m.id}>
                          <TableCell className="whitespace-nowrap">{m.fecha_uso || "—"}</TableCell>
                          <TableCell className="font-medium">{m.lote || "—"}</TableCell>
                          <TableCell className="text-center font-medium">{m.cantidad}</TableCell>
                          <TableCell>{m.patient_name || "—"}</TableCell>
                          <TableCell>{m.user_name || "—"}</TableCell>
                          <TableCell><Badge variant="secondary" className="capitalize">{m.tipo_movimiento}</Badge></TableCell>
                          <TableCell className="max-w-[200px] truncate">{m.observaciones || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Stock Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar existencia</DialogTitle><DialogDescription>Registra un nuevo lote para {product.descripcion}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Lote *</Label><Input value={newLote} onChange={e => setNewLote(e.target.value)} placeholder="Ej: LOT-2025-A" /></div>
            <div className="space-y-1.5"><Label>Fecha de registro *</Label><Input type="date" value={newFechaRegistro} onChange={e => setNewFechaRegistro(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Fecha de vencimiento *</Label><Input type="date" value={newFechaVenc} onChange={e => setNewFechaVenc(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Cantidad *</Label><Input type="number" min={1} value={newCantidad} onChange={e => setNewCantidad(Number(e.target.value))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button><Button onClick={handleAddStock}>Agregar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consume Stock Dialog */}
      <Dialog open={consumeOpen} onOpenChange={setConsumeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar uso</DialogTitle><DialogDescription>Selecciona el lote, cantidad y opcionalmente el paciente</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Seleccionar lote *</Label>
              <Select value={consumeInstanceId} onValueChange={setConsumeInstanceId}>
                <SelectTrigger><SelectValue placeholder="Selecciona un lote" /></SelectTrigger>
                <SelectContent>{activeInstances.map(inst => <SelectItem key={inst.id} value={inst.id}>{inst.lote} — Vence: {inst.fechaVencimiento} — Cant: {inst.cantidad}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Cantidad a consumir *</Label>
              <Input type="number" min={1} max={selectedConsumeInstance?.cantidad || undefined} value={consumeQty} onChange={e => setConsumeQty(Number(e.target.value))} />
              {selectedConsumeInstance && <p className="text-xs text-muted-foreground">Disponible: {selectedConsumeInstance.cantidad} unidades</p>}
            </div>
            <div className="space-y-1.5"><Label>Paciente asociado (opcional)</Label>
              <Select value={consumePatientId} onValueChange={v => {
                setConsumePatientId(v);
                const p = patients.find(p => p.id === v);
                setConsumePatientName(p?.name || "");
              }}>
                <SelectTrigger><SelectValue placeholder="Selecciona un paciente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin paciente</SelectItem>
                  {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Observaciones (opcional)</Label>
              <Textarea value={consumeObservaciones} onChange={e => setConsumeObservaciones(e.target.value)} placeholder="Notas sobre el consumo..." />
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setConsumeOpen(false)}>Cancelar</Button><Button onClick={handleConsume}>Registrar uso</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Instance Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar existencia</DialogTitle><DialogDescription>Modifica los datos de este lote.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label>Lote</Label><Input value={editLote} onChange={e => setEditLote(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Fecha de registro</Label><Input type="date" value={editFechaRegistro} onChange={e => setEditFechaRegistro(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Fecha de vencimiento</Label><Input type="date" value={editFecha} onChange={e => setEditFecha(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Cantidad</Label><div className="flex items-center h-10 rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">{editInstance?.cantidad ?? 0} unidades (solo modificable vía "Registrar uso")</div></div>
            <div className="space-y-1.5"><Label>Estado</Label>
              <Select value={editEstado} onValueChange={v => setEditEstado(v as StatusSemaphore)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="almacenado">Almacenado</SelectItem><SelectItem value="en_uso">En uso</SelectItem><SelectItem value="usado">Usado</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Observaciones</Label><Textarea value={editObservaciones} onChange={e => setEditObservaciones(e.target.value)} placeholder="Notas adicionales..." /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button><Button onClick={handleEditSave}>Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
