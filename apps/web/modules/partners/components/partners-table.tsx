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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash, FileText } from "lucide-react";
import { Partner } from "../types";
import { Badge } from "@/components/ui/badge";

interface PartnersTableProps {
  partners: Partner[];
  onEdit: (partner: Partner) => void;
  onDelete: (partner: Partner) => void;
  onViewStatement?: (partner: Partner) => void;
}

export function PartnersTable({
  partners,
  onEdit,
  onDelete,
  onViewStatement,
}: PartnersTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>RIF/CI</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {partners.map((partner) => (
            <TableRow key={partner.id}>
              <TableCell className="font-medium">{partner.name}</TableCell>
              <TableCell>{partner.taxId}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    partner.type === "CUSTOMER" ? "default" : "secondary"
                  }
                >
                  {partner.type === "CUSTOMER"
                    ? "Cliente"
                    : partner.type === "SUPPLIER"
                      ? "Proveedor"
                      : "Ambos"}
                </Badge>
              </TableCell>
              <TableCell>{partner.email || "-"}</TableCell>
              <TableCell>{partner.phone || "-"}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onViewStatement?.(partner)}
                    >
                      <FileText className="mr-2 h-4 w-4" /> Estado de Cuenta
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(partner)}>
                      <Pencil className="mr-2 h-4 w-4" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(partner)}
                      className="text-red-600 focus:text-red-600"
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
