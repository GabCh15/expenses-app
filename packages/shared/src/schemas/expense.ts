import { z } from "zod";

export const createExpenseSchema = z.object({
  amount: z.number().positive("Amount must be a positive number"),
  categoryId: z.string().uuid("Invalid category ID"),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  expenseDate: z
    .string()
    .datetime({ message: "Invalid ISO date" })
    .optional()
    .default(() => new Date().toISOString()),
  currency: z.enum(["USD", "COP", "EUR"]),
});

export const updateExpenseSchema = z
  .object({
    amount: z.number().positive("Amount must be a positive number").optional(),
    categoryId: z.string().uuid("Invalid category ID").optional(),
    description: z
      .string()
      .max(500, "Description must be at most 500 characters")
      .optional(),
    expenseDate: z.string().datetime({ message: "Invalid ISO date" }).optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: "At least one field must be provided for update",
  });

export const expenseFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  categoryId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sort: z
    .enum(["date_desc", "date_asc", "amount_desc", "amount_asc"])
    .default("date_desc"),
});

export const expenseResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  categoryId: z.string().uuid().nullable(),
  amount: z.string(), // DECIMAL returns as string from DB
  description: z.string().nullable(),
  expenseDate: z.string(), // date returns as string from DB
  source: z.enum(["web", "telegram"]),
  currency: z.enum(["USD", "COP", "EUR"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  category: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      color: z.string(),
      icon: z.string().nullable(),
    })
    .nullable(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseFilters = z.infer<typeof expenseFiltersSchema>;
export type ExpenseResponse = z.infer<typeof expenseResponseSchema>;
