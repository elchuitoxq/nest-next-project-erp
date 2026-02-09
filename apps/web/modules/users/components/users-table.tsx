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
import { User } from "../types";
import { useUserMutations } from "../hooks/use-user-mutations";
import { motion, AnimatePresence } from "framer-motion";

interface UsersTableProps {
  users: User[];
  onEdit: (user: User) => void;
  isLoading?: boolean;
}

export function UsersTable({ users, onEdit, isLoading }: UsersTableProps) {
  const { deleteUser } = useUserMutations();

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este usuario?")) {
      await deleteUser.mutateAsync(id);
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
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead className="hidden lg:table-cell">Roles</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="wait">
            {users.map((user, index) => (
              <motion.tr
                key={user.id}
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
                  {user.name}
                </TableCell>
                <TableCell className="py-3 px-4 hidden md:table-cell">
                  {user.email}
                </TableCell>
                <TableCell className="py-3 px-4 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <Badge key={role} variant="outline" className="text-xs">
                        {role}
                      </Badge>
                    ))}
                  </div>
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
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600"
                      >
                        <Trash className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </motion.tr>
            ))}
            {!isLoading && users.length === 0 && (
              <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <TableCell colSpan={4} className="h-24 text-center">
                  No se encontraron usuarios.
                </TableCell>
              </motion.tr>
            )}
          </AnimatePresence>
        </TableBody>
      </Table>
    </div>
  );
}
