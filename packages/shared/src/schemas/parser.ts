import { z } from "zod";

export const parsedExpenseSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string().uuid().nullable(),
  description: z.string().nullable(),
});

export type ParsedExpense = z.infer<typeof parsedExpenseSchema>;
