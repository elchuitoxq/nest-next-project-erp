"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RetentionsTable } from "@/modules/treasury/components/retentions-table";
import { List } from "lucide-react";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumb } from "@/components/dynamic-breadcrumb";

type RetentionType = "IVA" | "ISLR";

import { motion, AnimatePresence } from "framer-motion";

export default function RetentionsPage() {
  const [activeTab, setActiveTab] = useState<RetentionType>("IVA");

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <DynamicBreadcrumb />
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col gap-4 p-4 pt-0"
      >
        <div className="flex flex-col gap-2 py-4">
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Retenciones de Impuestos
          </h2>
          <p className="text-muted-foreground text-sm">
            Consulta y descarga de comprobantes de retención IVA e ISLR.
          </p>
        </div>

        <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
          <Button
            variant={activeTab === "IVA" ? "default" : "ghost"}
            onClick={() => setActiveTab("IVA")}
            className={`gap-2 rounded-xl transition-all duration-300 ${activeTab === "IVA" ? "premium-shadow" : "hover:bg-gray-100"}`}
          >
            <List className="h-4 w-4" />
            <span className="font-bold text-xs uppercase tracking-wider">
              Retenciones IVA
            </span>
          </Button>
          <Button
            variant={activeTab === "ISLR" ? "default" : "ghost"}
            onClick={() => setActiveTab("ISLR")}
            className={`gap-2 rounded-xl transition-all duration-300 ${activeTab === "ISLR" ? "premium-shadow" : "hover:bg-gray-100"}`}
          >
            <List className="h-4 w-4" />
            <span className="font-bold text-xs uppercase tracking-wider">
              Retenciones ISLR
            </span>
          </Button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border shadow-xl bg-white/60 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">
                  {activeTab === "IVA"
                    ? "Retenciones de IVA"
                    : "Retenciones de ISLR"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "IVA"
                    ? "Listado de retenciones aplicadas sobre el impuesto al valor agregado."
                    : "Listado de retenciones aplicadas sobre el impuesto sobre la renta."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RetentionsTable type={activeTab} />
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </SidebarInset>
  );
}
