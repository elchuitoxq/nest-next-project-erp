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

import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";

type RetentionType = "IVA" | "ISLR";

import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/layout/page-header";

export default function RetentionsPage() {
  const [activeTab, setActiveTab] = useState<RetentionType>("IVA");

  return (
    <SidebarInset>
      <AppHeader />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col gap-4 p-4 pt-0"
      >
        <PageHeader
          title="Retenciones de Impuestos"
          description="Consulta y descarga de comprobantes de retención IVA e ISLR."
        />

        <div className="grid grid-cols-2 gap-2 border-b border-gray-100 pb-4 sm:flex sm:items-center sm:w-auto">
          <Button
            variant={activeTab === "IVA" ? "default" : "ghost"}
            onClick={() => setActiveTab("IVA")}
            className={`w-full sm:w-auto gap-2 rounded-xl transition-all duration-300 ${activeTab === "IVA" ? "premium-shadow" : "hover:bg-gray-100"}`}
          >
            <List className="h-4 w-4" />
            <span className="font-bold text-xs uppercase tracking-wider">
              Retenciones IVA
            </span>
          </Button>
          <Button
            variant={activeTab === "ISLR" ? "default" : "ghost"}
            onClick={() => setActiveTab("ISLR")}
            className={`w-full sm:w-auto gap-2 rounded-xl transition-all duration-300 ${activeTab === "ISLR" ? "premium-shadow" : "hover:bg-gray-100"}`}
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
            <Card className="border premium-shadow">
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
