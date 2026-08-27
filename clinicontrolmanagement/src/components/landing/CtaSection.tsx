import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const CtaSection = () => {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Empieza a simplificar la gestión de tu consultorio
          </h2>
          <Button size="lg" className="text-base px-10">
            Crear cuenta
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
