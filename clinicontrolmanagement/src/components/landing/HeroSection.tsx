import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, Users, FileText, BarChart3, Shield, Clock } from "lucide-react";

const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section id="inicio" className="pt-28 pb-20 md:pt-36 md:pb-28">
      <div className="container px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
              Control inteligente para consultorios odontológicos
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Gestiona tu inventario clínico, registra pacientes y organiza la
              información necesaria para RIPS en una sola plataforma.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="text-base px-8" onClick={() => navigate("/login")}>
                Probar CliniControl
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8" onClick={() => document.getElementById("planes")?.scrollIntoView({ behavior: "smooth" })}>
                Ver planes
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            {/* App mockup reflecting real UI */}
            <div className="rounded-2xl overflow-hidden shadow-2xl border bg-background">
              {/* Topbar */}
              <div className="bg-secondary px-4 py-3 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground text-xs font-bold">C</span>
                  </div>
                  <span className="text-secondary-foreground font-semibold text-sm">CliniControl</span>
                </div>
                <div className="ml-auto flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  <div className="w-16 h-4 rounded bg-secondary-foreground/10" />
                </div>
              </div>

              {/* Dashboard mockup */}
              <div className="p-4 space-y-3">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: Users, label: "Pacientes", val: "124", color: "text-primary" },
                    { icon: Package, label: "Productos", val: "58", color: "text-primary" },
                    { icon: FileText, label: "Atenciones", val: "312", color: "text-primary" },
                  ].map((s, i) => (
                    <div key={i} className="rounded-lg border p-3 bg-card">
                      <s.icon className={`h-4 w-4 ${s.color} mb-1`} />
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-lg font-bold text-foreground">{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* Inventory preview table */}
                <div className="rounded-lg border overflow-hidden">
                  <div className="bg-muted/50 px-3 py-2 flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Inventario reciente</span>
                  </div>
                  <div className="divide-y">
                    {[
                      { name: "Resina composite", lot: "LOT-2025-A", qty: 15, sem: "bg-green-500" },
                      { name: "Anestésico lidocaína", lot: "LOT-2025-B", qty: 8, sem: "bg-yellow-400" },
                      { name: "Guantes nitrilo", lot: "LOT-2025-C", qty: 3, sem: "bg-red-500" },
                    ].map((item, i) => (
                      <div key={i} className="px-3 py-2 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-foreground">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">{item.lot}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">{item.qty}</span>
                          <span className={`h-2.5 w-2.5 rounded-full ${item.sem}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="flex gap-2">
                  <div className="flex-1 rounded-lg border p-2 flex items-center gap-2 bg-card">
                    <BarChart3 className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-medium text-foreground">Reportes</span>
                  </div>
                  <div className="flex-1 rounded-lg border p-2 flex items-center gap-2 bg-card">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-medium text-foreground">RIPS</span>
                  </div>
                  <div className="flex-1 rounded-lg border p-2 flex items-center gap-2 bg-card">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-medium text-foreground">Historial</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
