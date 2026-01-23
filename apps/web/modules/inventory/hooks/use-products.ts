import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Product, CreateProductValues, UpdateProductValues } from "../types";
import { toast } from "sonner";

export function useProducts(search?: string) {
  return useQuery({
    queryKey: ["products", search],
    queryFn: async () => {
      const { data } = await api.get<Product[]>("/products", {
        params: { search },
      });
      return data;
    },
  });
}

export function useProductMutations() {
  const queryClient = useQueryClient();

  const createProduct = useMutation({
    mutationFn: async (data: CreateProductValues) => {
      return await api.post("/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto creado exitosamente");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al crear producto");
    },
  });

  const updateProduct = useMutation({
    mutationFn: async (data: UpdateProductValues) => {
      const { id, ...rest } = data;
      return await api.patch(`/products/${id}`, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Producto actualizado exitosamente");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Error al actualizar producto"
      );
    },
  });

  return { createProduct, updateProduct };
}
