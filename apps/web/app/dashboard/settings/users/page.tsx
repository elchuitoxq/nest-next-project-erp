import { Suspense } from "react";
import { UsersAndRolesView } from "@/modules/users/components/users-and-roles-view";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Usuarios y Roles | ERP",
  description: "Gestión de usuarios y permisos.",
};

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <UsersAndRolesView />
    </Suspense>
  );
}
