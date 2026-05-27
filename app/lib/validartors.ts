import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string()
    .min(3, "Nome muito curto"),

  email: z
    .email("Email inválido"),

  password: z
    .string()
    .min(6, "Senha mínima 6 caracteres"),
});

export const loginSchema = z.object({
  email: z
    .email("Email inválido"),

  password: z
    .string()
    .min(6),
});