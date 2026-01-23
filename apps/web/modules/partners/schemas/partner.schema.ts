import { z } from "zod";

export const partnerSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  taxId: z.string().min(1, "El RIF/CI es requerido"),
  address: z.string().optional(),
  phone: z.string().optional(),
  type: z.enum(["CUSTOMER", "SUPPLIER", "BOTH"], {
    errorMap: () => ({ message: "Debe seleccionar un tipo de socio" }),
  } as any),

  // Fiscal Info
  taxpayerType: z
    .enum(["ORDINARY", "SPECIAL", "FORMAL"], {
      errorMap: () => ({
        message: "Debe seleccionar un tipo de contribuyente",
      }),
    } as any)
    .default("ORDINARY"),
  retentionRate: z.string().default("0"),

  isSpecialTaxpayer: z.boolean().default(false),
  creditLimit: z.string().default("0"),
});

export type PartnerFormValues = z.infer<typeof partnerSchema>;
