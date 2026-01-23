import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/use-auth-store";
import { useEffect } from "react";

export function useProfile() {
  const { user, login, token } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      // Assuming GET /auth/profile or /users/me exists
      // If not, we might need to use GET /users/:id
      if (!user?.id) return null;
      const { data } = await api.get(`/users/${user.id}`);
      return data;
    },
    enabled: !!user?.id && !!token,
  });

  useEffect(() => {
    if (data && token && user) {
      // We only want to update if branches changed to avoid loops
      // But for simplicity, we can sync the user object if the API returns the enriched structure
      // Verify if `data` structure matches `user` interface
      const updatedUser = {
        ...user,
        ...data,
        // Ensure branches are mapped correctly if structure differs
        branches: data.branches || user.branches,
      };

      // Avoid infinite re-renders/loop updates strictly
      // Simple JSON comparison for branches
      const currentBranches = JSON.stringify(user.branches);
      const newBranches = JSON.stringify(updatedUser.branches);

      if (currentBranches !== newBranches) {
        login(token, updatedUser);
      }
    }
  }, [data, token, user, login]);

  return {
    profile: data,
    isLoading,
  };
}
