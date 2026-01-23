import { z } from "zod";

const moveTypeEnum = z.enum(["IN", "OUT", "TRANSFER", "ADJUST"]);

export const inventoryMoveSchema = z
  .object({
    type: moveTypeEnum,
    fromWarehouseId: z.string().optional(),
    toWarehouseId: z.string().optional(),
    note: z.string(),
    lines: z
      .array(
        z.object({
          productId: z.string().min(1, "Producto requerido"),
          quantity: z.coerce.number().min(0.01, "Cantidad debe ser mayor a 0"),
          cost: z.coerce.number(),
        }),
      )
      .min(1, "Debe agregar al menos un producto"),
  })
  .superRefine((data, ctx) => {
    if (data.type === "IN") {
      if (!data.toWarehouseId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Almacén destino es requerido para Entradas",
          path: ["toWarehouseId"],
        });
      }
    }
    if (data.type === "OUT") {
      if (!data.fromWarehouseId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Almacén origen es requerido para Salidas",
          path: ["fromWarehouseId"],
        });
      }
    }
    if (data.type === "TRANSFER") {
      if (!data.fromWarehouseId || !data.toWarehouseId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Ambos almacenes son requeridos para Transferencias",
          path: ["fromWarehouseId"], // Mark field
        });
        if (!data.toWarehouseId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Requerido",
            path: ["toWarehouseId"],
          });
        }
      }
      if (data.fromWarehouseId === data.toWarehouseId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "No puedes transferir al mismo almacén",
          path: ["toWarehouseId"],
        });
      }
    }
    if (data.type === "ADJUST") {
      if (!data.fromWarehouseId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Almacén origen (donde se ajusta) es requerido",
          path: ["fromWarehouseId"],
        });
      }
    }
  });

export type InventoryMoveFormValues = z.infer<typeof inventoryMoveSchema>;
