import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name?: string;
  roles: string[];
  branchId?: string; // Default branch from token
  branches?: { id: string; name: string; isDefault: boolean }[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  currentBranch: { id: string; name: string } | null;
  isAuthenticated: boolean;
  hasHydrated: boolean; // Flag to track hydration
  login: (token: string, user: User) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
  setBranch: (branch: { id: string; name: string }) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      currentBranch: null,
      isAuthenticated: false,
      hasHydrated: false,
      login: (token, user) => {
        // Auto-set current branch from default or first available
        let initialBranch = null;
        if (user.branchId && user.branches) {
          const defaultBranch = user.branches.find(
            (b) => b.id === user.branchId,
          );
          if (defaultBranch)
            initialBranch = { id: defaultBranch.id, name: defaultBranch.name };
        } else if (user.branches && user.branches.length > 0) {
          initialBranch = {
            id: user.branches[0].id,
            name: user.branches[0].name,
          };
        }

        set({
          token,
          user,
          currentBranch: initialBranch,
          isAuthenticated: true,
        });
      },
      logout: () =>
        set({
          token: null,
          user: null,
          currentBranch: null,
          isAuthenticated: false,
        }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
      setBranch: (branch) => set({ currentBranch: branch }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
