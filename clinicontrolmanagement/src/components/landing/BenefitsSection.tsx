import { motion } from "framer-motion";
import { CheckCircle2, Package, Users, FileText, Clock } from "lucide-react";

const benefits = [
  "Semaforización automática de vencimientos",
  "Trazabilidad completa de consumos por lote",
  "Datos RIPS listos para exportación JSON",
  "Gestión multi-consultorio con aislamiento",
  "Persistencia segura en la nube",
  "Roles diferenciados: administrador y clínico",
];

const BenefitsSection = () => {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container px-4 md:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pensado para consultorios odontológicos reales
            </h2>
            <p className="text-muted-foreground mb-8">
              Cada funcionalidad fue diseñada para resolver problemas operativos reales del día a día clínico.
            </p>
            <div className="space-y-3">
              {benefits.map((b, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">{b}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Mini module preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-3"
          >
            {[
              { icon: Package, title: "Módulo de Inventario", desc: "Productos, lotes, semaforización e historial de consumos" },
              { icon: Users, title: "Módulo de Pacientes", desc: "Registro demográfico completo con campos RIPS" },
              { icon: FileText, title: "Módulo de Atenciones", desc: "Consultas y procedimientos por odontólogo responsable" },
              { icon: Clock, title: "Módulo de RIPS", desc: "Generación de JSON estructurado para reportes obligatorios" },
            ].map((m, i) => (
              <div key={i} className="flex items-start gap-4 bg-background rounded-xl p-5 border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <m.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-0.5">{m.title}</h3>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
