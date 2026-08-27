import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Plan Básico",
    features: [
      "Gestión de inventario",
      "Registro de pacientes",
      "Soporte básico",
    ],
    highlighted: false,
  },
  {
    name: "Plan Completo",
    features: [
      "Todo lo del plan básico",
      "Registro de consumos por paciente",
      "Exportación de información para RIPS",
    ],
    highlighted: true,
  },
];

const PlansSection = () => {
  return (
    <section id="planes" className="py-20">
      <div className="container px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Planes</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className={`rounded-xl p-8 border ${
                plan.highlighted
                  ? "border-primary bg-accent/30 ring-2 ring-primary/20"
                  : "bg-background"
              }`}
            >
              <h3 className="text-xl font-bold mb-6">{plan.name}</h3>
              <ul className="space-y-4 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                variant={plan.highlighted ? "default" : "outline"}
              >
                Elegir plan
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlansSection;
