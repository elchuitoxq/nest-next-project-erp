import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  roleIds: z.array(z.string()),
  branchIds: z.array(z.string()),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  password: z.string(), // Required string type, but can be empty for update
  roleIds: z.array(z.string()).min(1, "Debe asignar al menos un rol"),
  branchIds: z.array(z.string()).min(1, "Debe asignar al menos una sucursal"),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
