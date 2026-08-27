import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileJson, Users, User } from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

interface AttentionRow {
  attentionId: string;
  patientId: string;
  patientNombres: string;
  patientPrimerApellido: string;
  patientSegundoApellido: string;
  patientDocumento: string;
  fechaInicialAtencion: string;
  consultaEnabled: boolean;
  procedimientoEnabled: boolean;
  totalConsultas: number;
  totalProcedimientos: number;
}

function ParticularTab({ rows, loading }: { rows: AttentionRow[]; loading: boolean }) {
  const handleGenerate = useCallback(async (row: AttentionRow) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_URL}/rest/v1/rips/particular/${row.attentionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Error generando RIPS"); }
      const rips = await res.json();
      downloadJson(rips, `RIPS_Particular_${row.patientDocumento}_${row.fechaInicialAtencion?.replace(/[: ]/g, "-")}.json`);
      toast.success("Archivo JSON descargado correctamente");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al generar RIPS");
    }
  }, []);

  if (loading) return <div className="py-8"><Skeleton className="h-20 w-full" /></div>;
  if (!rows.length) return <div className="flex flex-col items-center justify-center py-16 text-center gap-3"><User className="h-10 w-10 text-muted-foreground" /><p className="text-muted-foreground">No hay atenciones registradas para pacientes particulares.</p></div>;

  return (
    <Table>
      <TableHeader><TableRow><TableHead>Paciente</TableHead><TableHead>Documento</TableHead><TableHead>Fecha atención</TableHead><TableHead className="text-center">Consultas</TableHead><TableHead className="text-center">Procedimientos</TableHead><TableHead className="text-right">Acción</TableHead></TableRow></TableHeader>
      <TableBody>
        {rows.map(r => (
            <TableRow key={r.attentionId}>
              <TableCell className="font-medium">{r.patientNombres} {r.patientPrimerApellido} {r.patientSegundoApellido}</TableCell>
              <TableCell>{r.patientDocumento}</TableCell>
              <TableCell>{r.fechaInicialAtencion}</TableCell>
              <TableCell className="text-center">{r.totalConsultas}</TableCell><TableCell className="text-center">{r.totalProcedimientos}</TableCell>
              <TableCell className="text-right"><Button size="sm" onClick={() => handleGenerate(r)} className="gap-1.5"><Download className="h-4 w-4" />Generar JSON</Button></TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}

function AmparadoTab({ rows, loading }: { rows: AttentionRow[]; loading: boolean }) {
  const [selected, setSelected] = useState<string[]>([]);
  const toggleSelect = (attId: string) => setSelected(prev => prev.includes(attId) ? prev.filter(id => id !== attId) : [...prev, attId]);

  const handleDownload = useCallback(async () => {
    if (!selected.length) { toast.error("Selecciona al menos una atención amparada"); return; }
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_URL}/rest/v1/rips/amparado`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ attention_ids: selected }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Error generando RIPS"); }
      const rips = await res.json();
      downloadJson(rips, `RIPS_Amparado_${new Date().toISOString().slice(0, 10)}.json`);
      toast.success("Archivo JSON descargado correctamente");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al generar RIPS");
    }
  }, [selected]);

  if (loading) return <div className="py-8"><Skeleton className="h-20 w-full" /></div>;
  if (!rows.length) return <div className="flex flex-col items-center justify-center py-16 text-center gap-3"><Users className="h-10 w-10 text-muted-foreground" /><p className="text-muted-foreground">No hay atenciones registradas para pacientes amparados.</p></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{selected.length} atención{selected.length !== 1 ? "es" : ""} seleccionada{selected.length !== 1 ? "s" : ""}</p>
        <Button onClick={handleDownload} disabled={!selected.length} className="gap-1.5"><Download className="h-4 w-4" />Descargar JSON ({selected.length})</Button>
      </div>
      <Table>
        <TableHeader><TableRow><TableHead className="w-12"></TableHead><TableHead>Consecutivo</TableHead><TableHead>Paciente</TableHead><TableHead>Documento</TableHead><TableHead>Fecha atención</TableHead><TableHead className="text-center">Consultas</TableHead><TableHead className="text-center">Procedimientos</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.map(r => {
            const isSelected = selected.includes(r.attentionId);
            const consecutivo = isSelected ? selected.indexOf(r.attentionId) + 1 : "—";
            return (
              <TableRow key={r.attentionId} className={isSelected ? "bg-primary/5" : ""}>
                <TableCell><Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(r.attentionId)} /></TableCell>
                <TableCell>{isSelected ? <Badge variant="default">{consecutivo}</Badge> : <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="font-medium">{r.patientNombres} {r.patientPrimerApellido} {r.patientSegundoApellido}</TableCell>
                <TableCell>{r.patientDocumento}</TableCell>
                <TableCell>{r.fechaInicialAtencion}</TableCell>
                <TableCell className="text-center">{r.totalConsultas}</TableCell><TableCell className="text-center">{r.totalProcedimientos}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default function RipsGeneration() {
  const [particularRows, setParticularRows] = useState<AttentionRow[]>([]);
  const [amparadoRows, setAmparadoRows] = useState<AttentionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const res = await fetch(`${API_URL}/rest/v1/rips/attentions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Error al cargar atenciones RIPS");
        const data = await res.json();
        setParticularRows(data.particular || []);
        setAmparadoRows(data.amparado || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary font-display">Generación de RIPS</h1>
        <p className="text-muted-foreground mt-1">Estructura y descarga los archivos JSON de RIPS a partir de las atenciones registradas.</p>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2.5"><FileJson className="h-5 w-5 text-primary" /></div>
            <div><CardTitle className="text-lg">Archivos RIPS</CardTitle><CardDescription>Selecciona las atenciones para generar el archivo JSON correspondiente.</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="particular">
            <TabsList className="w-full max-w-sm">
              <TabsTrigger value="particular" className="flex-1 gap-1.5"><User className="h-4 w-4" />Particular</TabsTrigger>
              <TabsTrigger value="amparado" className="flex-1 gap-1.5"><Users className="h-4 w-4" />Amparado</TabsTrigger>
            </TabsList>
            <TabsContent value="particular"><ParticularTab rows={particularRows} loading={loading} /></TabsContent>
            <TabsContent value="amparado"><AmparadoTab rows={amparadoRows} loading={loading} /></TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}