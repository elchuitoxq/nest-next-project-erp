import { z } from "zod";

export const createProductSchema = z.object({
  sku: z.string().min(1, "El SKU es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  cost: z.coerce.number().min(0, "El costo no puede ser negativo").default(0),
  price: z.coerce.number().min(0, "El precio no puede ser negativo").default(0),
  taxRate: z.coerce.number().default(16),
  minStock: z.coerce.number().default(0),
  isExempt: z.boolean().default(false),
  currencyId: z.string().min(1, "Debe seleccionar una moneda"),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductFormValues = z.infer<typeof createProductSchema>;
export type UpdateProductFormValues = z.infer<typeof updateProductSchema>;
