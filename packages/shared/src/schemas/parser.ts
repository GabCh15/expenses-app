import { z } from "zod";

export const parsedExpenseSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string().uuid().nullable(),
  description: z.string().nullable(),
  currency: z.enum(["USD", "COP", "EUR"]).nullable(),
});

export type ParsedExpense = z.infer<typeof parsedExpenseSchema>;
