import { motion } from "framer-motion";
import { Package, Users, FileText, History, BarChart3, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Package,
    title: "Inventario con semaforización",
    description: "Control de productos, lotes, vencimientos y alertas automáticas por colores para stock crítico.",
  },
  {
    icon: Users,
    title: "Registro de pacientes RIPS",
    description: "Datos demográficos completos alineados con la Resolución 2275 para reportes obligatorios.",
  },
  {
    icon: FileText,
    title: "Atenciones clínicas estructuradas",
    description: "Consultas y procedimientos con odontólogo responsable, fecha individual y datos del prestador.",
  },
  {
    icon: History,
    title: "Trazabilidad de consumos",
    description: "Historial completo de cada insumo consumido: lote, cantidad, paciente y usuario que registró.",
  },
  {
    icon: BarChart3,
    title: "Reportes PDF y CSV",
    description: "Genera reportes de inventario, stock por vencer y movimientos para análisis operativo.",
  },
  {
    icon: ShieldCheck,
    title: "Generación de RIPS JSON",
    description: "Exporta datos de atenciones en formato JSON conforme a la estructura exigida por normativa.",
  },
];

const SolutionSection = () => {
  return (
    <section id="funcionalidades" className="py-20">
      <div className="container px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Todo lo que necesitas en una sola plataforma
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            CliniControl integra los módulos esenciales para la operación diaria de tu consultorio odontológico.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-background rounded-xl p-6 border hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-base mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SolutionSection;
