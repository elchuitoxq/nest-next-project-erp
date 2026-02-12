import { z } from "zod";

export const positionSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional(),
  currencyId: z.string().uuid().optional().or(z.literal("")),
  baseSalaryMin: z.coerce.number().min(0).default(0),
  baseSalaryMax: z.coerce.number().min(0).default(0),
});

export type PositionFormValues = z.infer<typeof positionSchema>;

export const employeeSchema = z
  .object({
    firstName: z.string().min(1, "Nombre requerido"),
    lastName: z.string().min(1, "Apellido requerido"),
    identityCard: z.string().min(1, "Cédula requerida"),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    positionId: z.string().uuid("Cargo requerido"),
    departmentId: z.string().uuid("Departamento requerido"),
    salaryCurrencyId: z.string().uuid().optional().or(z.literal("")),
    baseSalary: z.coerce
      .number()
      .min(0, "Salario debe ser mayor o igual a 0")
      .default(0),
    payFrequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]).default("BIWEEKLY"),

    // Payment Config
    paymentMethod: z
      .enum(["BANK_TRANSFER", "CASH", "MOBILE_PAYMENT"])
      .default("BANK_TRANSFER"),
    bankId: z.string().uuid().optional().or(z.literal("")),
    accountNumber: z.string().optional(),
    accountType: z.enum(["CHECKING", "SAVINGS"]).default("CHECKING"),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === "BANK_TRANSFER") {
      if (!data.bankId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Banco requerido para transferencia",
          path: ["bankId"],
        });
      }
      if (!data.accountNumber || !/^\d{20}$/.test(data.accountNumber)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Cuenta de 20 dígitos requerida",
          path: ["accountNumber"],
        });
      }
    }
  });

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
