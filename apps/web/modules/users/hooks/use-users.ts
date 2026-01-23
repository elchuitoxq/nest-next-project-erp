import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Role, User } from "../types";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await api.get<User[]>("/users");
      return data;
    },
  });
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data } = await api.get<Role[]>("/roles");
      return data;
    },
  });
}
