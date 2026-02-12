"use client";

import { SidebarInset } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Save, Percent, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  usePayrollSettings,
  usePayrollSettingsMutations,
} from "@/modules/hr/hooks/use-payroll-settings";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function PayrollSettingsPage() {
  const { data: settings, isLoading } = usePayrollSettings();
  const { updateSetting } = usePayrollSettingsMutations();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEdit = (key: string, currentValue: string) => {
    setEditingKey(key);
    setEditValue(currentValue);
  };

  const handleSave = (key: string) => {
    const value = parseFloat(editValue);
    if (isNaN(value) || value < 0) return;
    updateSetting.mutate({ key, value });
    setEditingKey(null);
    setEditValue("");
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue("");
  };

  const getTypeIcon = (type: string) => {
    if (type === "PERCENTAGE") return <Percent className="h-3 w-3" />;
    return <DollarSign className="h-3 w-3" />;
  };

  const getTypeBadge = (type: string) => {
    const label =
      type === "PERCENTAGE"
        ? "Porcentaje"
        : type === "FIXED_USD"
          ? "Fijo USD"
          : "Fijo VES";
    return (
      <Badge
        variant="outline"
        className={cn(
          "text-[10px] uppercase font-bold tracking-tighter gap-1",
          type === "PERCENTAGE"
            ? "bg-violet-500/10 text-violet-600 border-violet-200"
            : "bg-emerald-500/10 text-emerald-600 border-emerald-200",
        )}
      >
        {getTypeIcon(type)}
        {label}
      </Badge>
    );
  };

  const formatValue = (value: string, type: string) => {
    const num = parseFloat(value);
    if (type === "PERCENTAGE") return `${num}%`;
    if (type === "FIXED_USD") return `$${num.toFixed(2)}`;
    return `Bs. ${num.toFixed(2)}`;
  };

  return (
    <SidebarInset>
      <AppHeader />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-1 flex-col gap-4 p-4 pt-0"
      >
        <div className="flex justify-between items-center py-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Contribuciones de Nómina
            </h1>
            <p className="text-muted-foreground">
              Tasas de aportes obligatorios (SSO, FAOV, INCE, LPH) y beneficios.
            </p>
          </div>
        </div>

        <Card className="border premium-shadow">
          <CardHeader>
            <CardTitle>Configuración de Aportes</CardTitle>
            <CardDescription>
              Modifica las tasas según la Gaceta Oficial vigente. Los cambios
              aplicarán a las próximas nóminas generadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border relative">
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-background/40 z-10 flex items-center justify-center backdrop-blur-[2px]"
                  >
                    <div className="bg-background/80 p-3 rounded-full shadow-lg border">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="px-4">Clave</TableHead>
                    <TableHead className="px-4">Descripción</TableHead>
                    <TableHead className="px-4">Tipo</TableHead>
                    <TableHead className="text-right px-4">Valor</TableHead>
                    <TableHead className="text-right px-4">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="wait">
                    {!isLoading && settings && settings.length > 0 ? (
                      settings.map((s, index) => (
                        <motion.tr
                          key={s.key}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          exit={{ opacity: 0, transition: { duration: 0.2 } }}
                          className="border-b last:border-0 hover:bg-muted/50 transition-colors group"
                        >
                          <TableCell className="font-mono text-xs font-bold text-primary py-3 px-4">
                            {s.key}
                          </TableCell>
                          <TableCell className="font-bold text-sm py-3 px-4">
                            {s.label}
                          </TableCell>
                          <TableCell className="py-3 px-4">
                            {getTypeBadge(s.type)}
                          </TableCell>
                          <TableCell className="text-right py-3 px-4">
                            {editingKey === s.key ? (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSave(s.key);
                                  if (e.key === "Escape") handleCancel();
                                }}
                                className="w-28 ml-auto text-right"
                                autoFocus
                              />
                            ) : (
                              <span
                                className="cursor-pointer hover:text-primary transition-colors font-mono text-sm font-semibold"
                                onClick={() => handleEdit(s.key, s.value)}
                              >
                                {formatValue(s.value, s.type)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-3 px-4">
                            {editingKey === s.key ? (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancel}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSave(s.key)}
                                  disabled={updateSetting.isPending}
                                >
                                  <Save className="h-3.5 w-3.5 mr-1" />
                                  Guardar
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleEdit(s.key, s.value)}
                              >
                                Editar
                              </Button>
                            )}
                          </TableCell>
                        </motion.tr>
                      ))
                    ) : !isLoading ? (
                      <motion.tr
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <TableCell
                          colSpan={5}
                          className="text-center h-48 text-muted-foreground italic"
                        >
                          No hay configuraciones definidas.
                        </TableCell>
                      </motion.tr>
                    ) : null}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </SidebarInset>
  );
}
