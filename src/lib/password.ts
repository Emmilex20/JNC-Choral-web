import { z } from "zod";

// bcrypt only uses the first 72 bytes, so cap the length there.
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters")
  .refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), {
    message: "Password must include a letter and a number",
  });

export const BCRYPT_ROUNDS = 12;
