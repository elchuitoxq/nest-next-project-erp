import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Lightbulb, ArrowRight, BookOpen } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FiscalGuideProps {
  onClose: () => void;
}

export function FiscalGuide({ onClose }: FiscalGuideProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "¿Cómo funciona el Libro de Ventas?",
      description:
        "El sistema recopila automáticamente todas las facturas emitidas y las clasifica según las tasas impositivas vigentes. Verifica que todas las facturas del mes estén registradas antes de declarar.",
      icon: <BookOpen className="h-6 w-6 text-blue-500" />,
    },
    {
      title: "Retenciones de IVA",
      description:
        "Las retenciones que te han hecho tus clientes deben estar registradas para poder descontarlas del débito fiscal. Asegúrate de cargar los comprobantes de retención en cada cobro.",
      icon: <ArrowRight className="h-6 w-6 text-orange-500" />,
    },
    {
      title: "Declaración Seniat",
      description:
        "Al finalizar el periodo, usa la opción 'Exportar TXT' para generar el archivo listo para cargar en el portal del SENIAT. Recuerda archivar los comprobantes físicos.",
      icon: <Lightbulb className="h-6 w-6 text-yellow-500" />,
    },
  ];

  const currentStep = steps[step];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-6 overflow-hidden"
    >
      <Card className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-100 dark:border-blue-900">
        <CardContent className="p-4 sm:p-6 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl shadow-sm">
              {currentStep.icon}
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-bold text-lg">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                {currentStep.description}
              </p>
              <div className="flex items-center gap-2 pt-2">
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-1.5 rounded-full transition-colors ${
                        i === step ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                    className="h-8"
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (step < steps.length - 1) {
                        setStep((s) => s + 1);
                      } else {
                        onClose();
                      }
                    }}
                    className="h-8"
                  >
                    {step === steps.length - 1 ? "Entendido" : "Siguiente"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
