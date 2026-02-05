"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Info,
  BookOpen,
  HelpCircle,
  AlertCircle,
  FileText,
  UploadCloud,
} from "lucide-react";

interface FiscalGuidanceProps {
  type: "ventas" | "compras" | "liquidacion";
}

export function FiscalGuidance({ type }: FiscalGuidanceProps) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
          <BookOpen className="h-5 w-5 text-blue-500" /> Guía de Declaración
          Fiscal
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Este módulo te ayuda a cumplir con las normativas del{" "}
          <strong>SENIAT (Venezuela)</strong>. Aquí te explicamos qué estás
          viendo y qué debes hacer.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-blue-100 bg-blue-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" /> Los Libros
                Legales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Son registros contables cronológicos. Deben incluir{" "}
                <strong>todas</strong> las operaciones del mes, tengan retención
                o no. Úsalos para auditorías físicas e impresiones legales.
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-purple-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <UploadCloud className="h-4 w-4 text-purple-600" /> El Archivo
                TXT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Es un archivo técnico para el portal del SENIAT. Solo reporta
                facturas con <strong>retención</strong>. Si lo abres y ves menos
                facturas que en el libro, es normal y correcto legalmente.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="border-amber-100 bg-amber-50/30 dark:bg-amber-950/10">
        <CardContent className="py-3 flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-400">
              ¿Qué es el Criterio de Caja?
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-500 mt-1 leading-relaxed">
              Según la Providencia 0049, las retenciones se declaran en el mes
              que se <strong>pagan</strong>. Por eso verás facturas de meses
              anteriores que aparecen hoy: porque su pago o comprobante se
              generó en esta fecha.
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h4 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">
          Pasos Quincenales
        </h4>
        <div className="space-y-2">
          <div className="flex gap-3 text-sm">
            <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">
              1
            </div>
            <div>
              <p className="font-medium">Valida tus facturas</p>
              <p className="text-xs text-muted-foreground">
                Asegura que el número de control y RIF sean correctos.
              </p>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">
              2
            </div>
            <div>
              <p className="font-medium">Descarga el TXT</p>
              <p className="text-xs text-muted-foreground">
                Genera el archivo consolidado para{" "}
                {type === "ventas" ? "Ventas" : "Compras"}.
              </p>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">
              3
            </div>
            <div>
              <p className="font-medium">Sube al Portal SENIAT</p>
              <p className="text-xs text-muted-foreground">
                Menu: Procesos Económicos {">"} Retenciones {">"} IVA.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
