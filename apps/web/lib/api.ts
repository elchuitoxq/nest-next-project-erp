import { useAuthStore } from "@/stores/use-auth-store";
import { toast } from "sonner";

const BASE_URL =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000") + "/api";

interface RequestOptions extends RequestInit {
  params?: Record<
    string,
    string | number | boolean | (string | number | boolean)[] | undefined | null
  >;
  responseType?: "json" | "blob" | "text";
}

export interface ApiError extends Error {
  response?: {
    data: any;
    status: number;
  };
}

class ApiClient {
  private async request<T>(
    url: string,
    options: RequestOptions = {},
  ): Promise<{ data: T }> {
    const { token, currentBranch, logout } = useAuthStore.getState();

    // Prepare headers
    const headers = new Headers(options.headers);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (currentBranch?.id) {
      headers.set("x-branch-id", currentBranch.id);
    }
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }

    // Prepare URL with query params
    let finalUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, String(v)));
          } else {
            searchParams.append(key, String(value));
          }
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        finalUrl += (finalUrl.includes("?") ? "&" : "?") + queryString;
      }
    }

    try {
      const response = await fetch(finalUrl, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized
      if (response.status === 401 && !url.includes("/auth/login")) {
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          if (token) {
            logout();
            toast.error("Sesión expirada o inválida. Por favor inicie sesión.");
          }
        }
      }

      let data: any;
      if (options.responseType === "blob") {
        data = await response.blob();
      } else if (options.responseType === "text") {
        data = await response.text();
      } else {
        data = await response.json().catch(() => null);
      }

      if (!response.ok) {
        const error = new Error(
          data?.message || "Error en la petición",
        ) as ApiError;
        error.response = { data, status: response.status };
        throw error;
      }

      return { data: data as T };
    } catch (error) {
      throw error;
    }
  }

  get<T>(url: string, options?: RequestOptions) {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  post<T>(url: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>(url, {
      ...options,
      method: "POST",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  put<T>(url: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>(url, {
      ...options,
      method: "PUT",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  patch<T>(url: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>(url, {
      ...options,
      method: "PATCH",
      body: data instanceof FormData ? data : JSON.stringify(data),
    });
  }

  delete<T>(url: string, options?: RequestOptions) {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }
}

const api = new ApiClient();
export default api;
