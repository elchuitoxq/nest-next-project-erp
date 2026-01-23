import axios from "axios";
import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "sonner";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  const currentBranch = useAuthStore.getState().currentBranch;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (currentBranch?.id) {
    config.headers["x-branch-id"] = currentBranch.id;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      // Optional: Redirect logic can be handled by the AuthGuard or components listening to store
      toast.error("Sesión expirada. Por favor inicie sesión nuevamente.");
    }
    return Promise.reject(error);
  },
);

export default api;
