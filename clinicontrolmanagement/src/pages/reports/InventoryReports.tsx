import { useState } from "react";
import { FileText, Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateInput } from "@/components/ui/date-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { categoryLabels } from "@/types/inventory";
import { useAuth } from "@/contexts/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function isValidDate(d: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(d).getTime());
}

export default function InventoryReports() {
  const { profile } = useAuth();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const clinicName = profile?.clinic_id ? "Mi Consultorio" : "Consultorio";

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_URL}/rest/v1/reports/inventory/csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Error al obtener datos CSV"); }
      const csvRows: any[] = await res.json();
      if (csvRows.length === 0) { toast.error("No hay datos de inventario para exportar."); return; }

      const headers = ["Producto","Tipo","Marca","Lote","Fecha de Vencimiento","Proveedor","Stock Actual","Estado","Semaforización","Observaciones"];
      const lines = csvRows.map((r: any) => [
        `"${r.descripcion || ""}"`, `"${r.category ? categoryLabels[r.category as keyof typeof categoryLabels] || r.category : ""}"`, `"${r.marca || ""}"`,
        `"${r.lote || ""}"`, r.fecha_vencimiento || "", `"${r.proveedor || ""}"`, r.cantidad ?? 0, r.estado || "", r.semaforizacion || "", `"${r.observaciones || ""}"`,
      ]);
      const csv = [headers.join(","), ...lines.map((r: any[]) => r.join(","))].join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `inventario_${new Date().toISOString().split("T")[0]}.csv`; a.click();
      URL.revokeObjectURL(url);
      toast.success("Archivo CSV descargado correctamente.");
    } catch (err) {
      console.error(err);
      toast.error("Error al exportar CSV.");
    }
  };

  const handleGeneratePDF = async () => {
    if (!isValidDate(startDate) || !isValidDate(endDate)) { toast.error("Selecciona un rango de fechas válido."); return; }
    if (new Date(startDate) > new Date(endDate)) { toast.error("La fecha inicial no puede ser posterior a la final."); return; }

    setPdfGenerating(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_URL}/rest/v1/reports/inventory?start_date=${startDate}&end_date=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Error al obtener datos del reporte"); }
      const reportData = await res.json();

      const allRows: any[] = reportData.period_rows || [];
      const consumedRows: any[] = reportData.consumed_rows || [];
      const totalProducts: number = reportData.total_products || 0;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const today = new Date().toISOString().split("T")[0];

      doc.setFontSize(18); doc.setTextColor(15, 76, 92); doc.text("CliniControl", 14, 20);
      doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.text("Reporte de Inventario", 14, 27);
      doc.setFontSize(9); doc.text(`Consultorio: ${clinicName}`, 14, 36);
      doc.text(`Periodo: ${startDate} — ${endDate}`, 14, 42); doc.text(`Fecha de generación: ${today}`, 14, 48);
      doc.setDrawColor(0, 179, 167); doc.setLineWidth(0.5); doc.line(14, 52, pageWidth - 14, 52);

      doc.setFontSize(11); doc.setTextColor(30, 30, 30); doc.text("Resumen del periodo", 14, 60);
      doc.setFontSize(9); doc.setTextColor(80, 80, 80);
      doc.text(`Productos registrados: ${totalProducts}`, 14, 67);
      doc.text(`Movimientos en el periodo: ${allRows.length}`, 14, 73);
      doc.text(`Consumos registrados: ${consumedRows.length}`, 14, 79);

      let yPos = 87;
      if (allRows.length > 0) {
        doc.setFontSize(11); doc.setTextColor(30, 30, 30); doc.text("Inventario registrado en el periodo", 14, yPos); yPos += 4;
        autoTable(doc, {
          startY: yPos,
          head: [["Producto", "Tipo", "Marca", "Lote", "Vencimiento", "Cantidad", "Estado"]],
          body: allRows.map((r: any) => [r.descripcion, r.category ? categoryLabels[r.category as keyof typeof categoryLabels] || r.category : "", r.marca, r.lote, r.fecha_vencimiento, r.cantidad, r.estado]),
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [0, 179, 167], textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [245, 250, 250] },
          margin: { left: 14, right: 14 },
        });
        yPos = (doc as any).lastAutoTable.finalY + 10;
      } else {
        doc.setFontSize(9); doc.setTextColor(150, 150, 150); doc.text("No se encontraron registros en el periodo.", 14, yPos); yPos += 10;
      }

      if (consumedRows.length > 0) {
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.setFontSize(11); doc.setTextColor(30, 30, 30); doc.text("Consumos registrados en el periodo", 14, yPos); yPos += 4;
        autoTable(doc, {
          startY: yPos,
          head: [["Producto", "Lote", "Fecha Salida", "Estado"]],
          body: consumedRows.map((r: any) => [r.descripcion, r.lote, r.fecha_salida || "—", r.estado]),
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [15, 76, 92], textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [245, 248, 252] },
          margin: { left: 14, right: 14 },
        });
      }

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i); doc.setFontSize(7); doc.setTextColor(160, 160, 160);
        doc.text(`CliniControl — Reporte generado el ${today} — Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
      }
      doc.save(`reporte_inventario_${startDate}_${endDate}.pdf`);
      toast.success("Reporte PDF generado y descargado.");
    } catch (err) { console.error(err); toast.error("Error al generar el PDF."); }
    finally { setPdfGenerating(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary font-display">Reportes</h1>
        <p className="text-sm text-muted-foreground">Genera informes del inventario y exporta datos para análisis externo</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5 text-primary" />Reporte de Inventario (PDF)</CardTitle>
            <CardDescription>Genera un informe detallado del inventario y consumo en un periodo determinado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Fecha inicial</Label><DateInput value={startDate} onChange={setStartDate} /></div>
              <div className="space-y-2"><Label>Fecha final</Label><DateInput value={endDate} onChange={setEndDate} /></div>
            </div>
            {startDate && endDate && isValidDate(startDate) && isValidDate(endDate) && new Date(startDate) > new Date(endDate) && (
              <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />La fecha inicial debe ser anterior a la fecha final</p>
            )}
            <Button onClick={handleGeneratePDF} disabled={pdfGenerating || !isValidDate(startDate) || !isValidDate(endDate)} className="w-full gap-2">
              {pdfGenerating ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />Generando...</> : <><Download className="h-4 w-4" />Generar PDF</>}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><FileSpreadsheet className="h-5 w-5 text-primary" />Exportar Inventario (CSV)</CardTitle>
            <CardDescription>Descarga todos los datos del inventario en formato CSV para análisis en herramientas externas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
              <p>El archivo CSV incluirá:</p>
              <ul className="list-disc list-inside text-xs space-y-0.5">
                <li>Nombre y tipo de producto</li><li>Marca y proveedor</li><li>Lote y fecha de vencimiento</li><li>Stock actual y estado</li><li>Semaforización y observaciones</li>
              </ul>
            </div>
            <Button onClick={handleExportCSV} variant="outline" className="w-full gap-2"><Download className="h-4 w-4" />Exportar CSV</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
