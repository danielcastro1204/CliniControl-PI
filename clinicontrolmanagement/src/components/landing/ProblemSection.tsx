import { motion } from "framer-motion";
import { FileSpreadsheet, Search, FileWarning } from "lucide-react";

const problems = [
  {
    icon: FileSpreadsheet,
    title: "Control manual de inventario en Excel",
    description: "Hojas de cálculo desactualizadas que generan errores y pérdida de tiempo.",
  },
  {
    icon: Search,
    title: "Poca trazabilidad de insumos por paciente",
    description: "Sin registro claro de qué insumos se utilizaron en cada procedimiento.",
  },
  {
    icon: FileWarning,
    title: "Dificultades para organizar información para RIPS",
    description: "Datos dispersos que complican la generación de reportes obligatorios.",
  },
];

const ProblemSection = () => {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Los consultorios pequeños enfrentan problemas operativos
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {problems.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="bg-background rounded-xl p-8 border text-center"
            >
              <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mx-auto mb-5">
                <p.icon className="w-7 h-7 text-accent-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
