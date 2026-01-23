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
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Branch } from "../types";
import { useBranchMutations } from "../hooks/use-branch-mutations";

interface BranchesTableProps {
  branches: Branch[];
  onEdit: (branch: Branch) => void;
}

export function BranchesTable({ branches, onEdit }: BranchesTableProps) {
  const { deleteBranch } = useBranchMutations();

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar (desactivar) esta sede?")) {
      await deleteBranch.mutateAsync(id);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.map((branch) => (
            <TableRow key={branch.id}>
              <TableCell className="font-medium">{branch.name}</TableCell>
              <TableCell>{branch.address || "-"}</TableCell>
              <TableCell>
                <Badge variant={branch.isActive ? "default" : "secondary"}>
                  {branch.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
