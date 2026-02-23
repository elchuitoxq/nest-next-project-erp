import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-4 rounded-full bg-red-100 p-4 dark:bg-red-900/20">
          <ShieldAlert className="h-12 w-12 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          Acceso Restringido
        </h1>
        <p className="mb-6 text-muted-foreground">
          No tienes los permisos necesarios para ver esta página o realizar esta
          acción. Si crees que es un error, contacta a tu administrador.
        </p>
        <div className="flex gap-4">
          <Button asChild variant="outline">
            <Link href="/dashboard">Ir al Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="javascript:history.back()">Volver Atrás</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
