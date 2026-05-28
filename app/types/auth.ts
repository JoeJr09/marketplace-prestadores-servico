import { z } from "zod";

const emptyStringToUndefined = (
  value: unknown
) => {
  if (
    typeof value === "string" &&
    value.trim() === ""
  ) {
    return undefined;
  }

  return value;
};

const emptyStringToNull = (
  value: unknown
) => {
  if (
    typeof value === "string" &&
    value.trim() === ""
  ) {
    return null;
  }

  return value;
};

export const databaseRoleSchema =
  z.enum([
    "client",
    "professional",
    "admin",
  ]);

export const registerRoleSchema =
  z
    .union([
      z.literal("CLIENTE"),
      z.literal("PRESTADOR"),
      z.literal("client"),
      z.literal("professional"),
    ])
    .transform((role) =>
      role === "CLIENTE"
        ? "client"
        : role === "PRESTADOR"
          ? "professional"
          : role
    );

export const registerAuthSchema =
  z.object({
    full_name: z
      .string()
      .trim()
      .min(3, "Nome deve ter pelo menos 3 caracteres"),
    email: z
      .string()
      .email("Email inválido")
      .transform((email) =>
        email.toLowerCase()
      ),
    password: z
      .string()
      .min(6, "Senha deve ter pelo menos 6 caracteres"),
    role: registerRoleSchema,
  });

export const loginAuthSchema =
  z.object({
    email: z
      .string()
      .email("Email inválido")
      .transform((email) =>
        email.toLowerCase()
      ),
    password: z
      .string()
      .min(6, "Senha deve ter pelo menos 6 caracteres"),
  });

export const updateAuthSchema =
  z
    .object({
      full_name: z.preprocess(
        emptyStringToUndefined,
        z
          .string()
          .trim()
          .min(
            3,
            "Nome deve ter pelo menos 3 caracteres"
          )
          .optional()
      ),
      email: z.preprocess(
        emptyStringToUndefined,
        z
          .string()
          .email("Email inválido")
          .transform((email) =>
            email.toLowerCase()
          )
          .optional()
      ),
      password: z.preprocess(
        emptyStringToUndefined,
        z
          .string()
          .min(
            6,
            "Senha deve ter pelo menos 6 caracteres"
          )
          .optional()
      ),
      phone: z.preprocess(
        emptyStringToNull,
        z
          .string()
          .trim()
          .min(
            8,
            "Telefone deve ter pelo menos 8 caracteres"
          )
          .nullable()
          .optional()
      ),
      avatar_url: z.preprocess(
        emptyStringToNull,
        z
          .string()
          .url("Avatar deve ser uma URL válida")
          .nullable()
          .optional()
      ),
    })
    .refine(
      (data) =>
        Object.values(data).some(
          (value) => value !== undefined
        ),
      {
        message:
          "Informe ao menos um campo para atualização",
      }
    );

export const jwtPayloadSchema =
  z.object({
    id: z.string().uuid("JWT sem id válido"),
    email: z
      .string()
      .email("JWT sem email válido"),
    role: databaseRoleSchema,
    iat: z.number().optional(),
    exp: z.number().optional(),
  });

export type DatabaseUserRole =
  z.infer<typeof databaseRoleSchema>;

export type RegisterAuthInput =
  z.infer<typeof registerAuthSchema>;

export type LoginAuthInput =
  z.infer<typeof loginAuthSchema>;

export type UpdateAuthInput =
  z.infer<typeof updateAuthSchema>;

export type JwtPayload =
  z.infer<typeof jwtPayloadSchema>;
