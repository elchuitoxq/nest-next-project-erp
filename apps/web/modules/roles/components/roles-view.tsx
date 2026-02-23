"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import api from "@/lib/api";
import { useRoles } from "../../users/hooks/use-users";
import { RolesTable } from "./roles-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface RolesViewProps {
  onEdit: (role: any) => void;
}

export function RolesView({ onEdit }: RolesViewProps) {
  const [search, setSearch] = useState("");

  const { data: roles, isLoading } = useRoles();

  const filteredRoles =
    roles?.filter((role: any) =>
      role.name.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  return (
    <div className="space-y-4">
      <Card className="border premium-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">
            Listado de Roles
          </CardTitle>
          <CardDescription>
            Visualiza y administra los roles disponibles en el ERP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RolesTable
            roles={filteredRoles}
            isLoading={isLoading}
            onEdit={onEdit}
            search={search}
            onSearchChange={setSearch}
          />
        </CardContent>
      </Card>
    </div>
  );
}
