import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Branch } from "../types";
import { useBranchMutations } from "../hooks/use-branch-mutations";
import { motion, AnimatePresence } from "framer-motion";

interface BranchesTableProps {
  branches: Branch[];
  onEdit: (branch: Branch) => void;
  isLoading?: boolean;
}

export function BranchesTable({
  branches,
  onEdit,
  isLoading,
}: BranchesTableProps) {
  const { deleteBranch } = useBranchMutations();

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar (desactivar) esta sede?")) {
      await deleteBranch.mutateAsync(id);
    }
  };

  return (
    <div className="rounded-md border relative overflow-x-auto">
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
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden md:table-cell">Dirección</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="wait">
            {branches.map((branch, index) => (
              <motion.tr
                key={branch.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: index * 0.05 },
                }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted group"
              >
                <TableCell className="font-medium py-3 px-4">
                  {branch.name}
                </TableCell>
                <TableCell className="py-3 px-4 hidden md:table-cell">
                  {branch.address || "-"}
                </TableCell>
                <TableCell className="py-3 px-4">
                  <Badge variant={branch.isActive ? "success" : "secondary"}>
                    {branch.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right py-3 px-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEdit(branch)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(branch.id)}
                        className="text-red-600"
                      >
                        <Trash className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </motion.tr>
            ))}
            {!isLoading && branches.length === 0 && (
              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <TableCell colSpan={4} className="h-24 text-center">
                  No se encontraron sedes.
                </TableCell>
              </motion.tr>
            )}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
