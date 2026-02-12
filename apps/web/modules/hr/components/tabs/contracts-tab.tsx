"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  FileText,
  Calendar as CalendarIcon,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import {
  ContractType,
  useContracts,
  useContractMutations,
  Contract,
} from "../../hooks/use-contracts";
import { ContractDialog } from "../dialogs/contract-dialog";
import { cn } from "@/lib/utils";

interface ContractsTabProps {
  employeeId: string;
}

export function ContractsTab({ employeeId }: ContractsTabProps) {
  const { data: contracts, isLoading } = useContracts(employeeId);
  const { createContract, terminateContract } = useContractMutations();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTerminateOpen, setIsTerminateOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(
    null,
  );
  const [contractToEdit, setContractToEdit] = useState<Contract | undefined>(
    undefined,
  );

  const handleTerminate = (endDate: string) => {
    if (selectedContractId) {
      terminateContract.mutate(
        { id: selectedContractId, endDate },
        {
          onSuccess: () => setIsTerminateOpen(false),
        },
      );
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: es });
  };

  const activeContract = contracts?.find((c) => c.status === "ACTIVE");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Historial de Contratos</h3>
          <p className="text-sm text-muted-foreground">
            Gestión de relaciones laborales y vigencia.
          </p>
        </div>
        {!activeContract && (
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setContractToEdit(undefined);
                setIsCreateOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Nuevo Contrato
            </Button>
            <ContractDialog
              open={isCreateOpen}
              onOpenChange={setIsCreateOpen}
              employeeId={employeeId}
              contract={contractToEdit}
            />
          </div>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts?.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    {contract.type}
                    {contract.trialPeriodEnd && (
                      <div className="text-xs text-muted-foreground">
                        Prueba hasta: {formatDate(contract.trialPeriodEnd)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(contract.startDate)}</TableCell>
                  <TableCell>{formatDate(contract.endDate)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contract.status === "ACTIVE" ? "success" : "secondary"
                      }
                    >
                      {contract.status === "ACTIVE" ? "Vigente" : "Terminado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {contract.status === "ACTIVE" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setContractToEdit(contract);
                            setIsCreateOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Dialog
                          open={
                            isTerminateOpen &&
                            selectedContractId === contract.id
                          }
                          onOpenChange={(open) => {
                            setIsTerminateOpen(open);
                            if (!open) setSelectedContractId(null);
                            else setSelectedContractId(contract.id);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="h-8"
                            >
                              Terminar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Terminar Contrato</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
                                <AlertTriangle className="h-4 w-4" />
                                <p className="text-sm">
                                  Esta acción finalizará la relación laboral
                                  activa.
                                </p>
                              </div>
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const formData = new FormData(
                                    e.currentTarget,
                                  );
                                  handleTerminate(
                                    formData.get("endDate") as string,
                                  );
                                }}
                                className="space-y-4"
                              >
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">
                                    Fecha de terminación
                                  </label>
                                  <Input
                                    name="endDate"
                                    type="date"
                                    required
                                    defaultValue={
                                      new Date().toISOString().split("T")[0]
                                    }
                                  />
                                </div>
                                <Button
                                  type="submit"
                                  variant="destructive"
                                  className="w-full"
                                  disabled={terminateContract.isPending}
                                >
                                  {terminateContract.isPending
                                    ? "Procesando..."
                                    : "Confirmar Terminación"}
                                </Button>
                              </form>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!contracts?.length && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No hay contratos registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
