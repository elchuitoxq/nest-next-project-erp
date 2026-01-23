import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export interface Move {
  id: string;
  code: string;
  type: string;
  date: string;
  fromWarehouse?: { name: string };
  toWarehouse?: { name: string };
  user?: { name: string };
  note?: string;
  lines?: {
    id: string;
    quantity: number;
    product: { name: string };
  }[];
}

interface MovesTableProps {
  moves: Move[];
  onSelectMove?: (move: Move) => void;
}

export function MovesTable({ moves, onSelectMove }: MovesTableProps) {
  const getTypeBadge = (type: string) => {
    switch (type) {
      case "IN":
        return <Badge className="bg-green-600">ENTRADA</Badge>;
      case "OUT":
        return <Badge variant="destructive">SALIDA</Badge>;
      case "TRANSFER":
        return <Badge variant="secondary">TRASLADO</Badge>;
      case "ADJUST":
        return <Badge variant="outline">AJUSTE</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Origen</TableHead>
            <TableHead>Destino</TableHead>
            <TableHead>Responsable</TableHead>
            <TableHead>Nota</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {moves.map((move) => (
            <TableRow
              key={move.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onSelectMove?.(move)}
            >
              <TableCell>
                {move.date
                  ? format(new Date(move.date), "dd/MM/yyyy HH:mm", {
                      locale: es,
                    })
                  : "-"}
              </TableCell>
              <TableCell className="font-medium">{move.code}</TableCell>
              <TableCell>{getTypeBadge(move.type)}</TableCell>
              <TableCell>{move.fromWarehouse?.name || "-"}</TableCell>
              <TableCell>{move.toWarehouse?.name || "-"}</TableCell>
              <TableCell>{move.user?.name || "-"}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {move.note || ""}
              </TableCell>
            </TableRow>
          ))}
          {!moves?.length && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-8 text-muted-foreground"
              >
                No hay movimientos registrados
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
