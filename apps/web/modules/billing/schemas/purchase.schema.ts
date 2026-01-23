import * as z from "zod";

export const purchaseSchema = z.object({
  partnerId: z.string().min(1, "Seleccione un proveedor"),
  currencyId: z.string().min(1, "Seleccione una moneda"),
  date: z.string().min(1, "Fecha requerida"),

  invoiceNumber: z.string().min(1, "El número de control es obligatorio"),

  warehouseId: z.string().optional(), // Optional, if they want to enter stock immediately

  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Seleccione un producto"),
        quantity: z.coerce.number().min(0.0001, "Cantidad requerida"),
        price: z.coerce.number().min(0, "Costo inválido"), // This is Unit Cost
        currencyId: z.string().optional(),
      }),
    )
    .min(1, "Agregue al menos un producto"),
});

export type PurchaseFormValues = z.infer<typeof purchaseSchema>;
