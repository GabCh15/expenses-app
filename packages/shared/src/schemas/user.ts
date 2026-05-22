import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().min(1, "Display name is required").optional(),
  currency: z.string().length(3, "Currency must be a 3-letter code").optional(),
});

export const linkTokenSchema = z.object({
  token: z
    .string()
    .length(6, "Token must be 6 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Token must be alphanumeric"),
});

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
  telegramLinked: z.boolean(),
  currency: z.string(),
  createdAt: z.string().datetime(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type LinkTokenInput = z.infer<typeof linkTokenSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
