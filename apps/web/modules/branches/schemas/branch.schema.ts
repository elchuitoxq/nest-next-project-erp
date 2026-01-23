import { z } from "zod";

export const createBranchSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  address: z.string().min(1, "La dirección es requerida"),
  isActive: z.boolean(),
});

export const updateBranchSchema = createBranchSchema.partial();

export type CreateBranchFormValues = z.infer<typeof createBranchSchema>;
export type UpdateBranchFormValues = z.infer<typeof updateBranchSchema>;
