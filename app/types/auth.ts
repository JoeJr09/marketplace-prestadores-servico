import { z } from "zod";

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const emptyStringToNull = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  return value;
};

function extractDigits(value: string) {
  return value.replace(/\D/g, "");
}

const passwordSchema = z
  .string()
  .min(8, "Senha deve ter pelo menos 8 caracteres")
  .regex(/[A-Z]/, {
    message: "Senha deve ter ao menos uma letra maiuscula",
  })
  .regex(/[a-z]/, {
    message: "Senha deve ter ao menos uma letra minuscula",
  })
  .regex(/[0-9]/, {
    message: "Senha deve ter ao menos um numero",
  })
  .regex(/[^A-Za-z0-9]/, {
    message: "Senha deve ter ao menos um caractere especial",
  });

const fullNameSchema = z
  .string()
  .trim()
  .min(3, "Nome deve ter pelo menos 3 caracteres")
  .regex(
    /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/,
    "Nome completo não pode conter números nem caracteres especiais",
  );

const emailSchema = z
  .string()
  .email("Email inválido")
  .refine((email) => email.includes("@"), "Email deve conter @")
  .transform((email) => email.toLowerCase());

export const databaseRoleSchema = z.enum(["client", "professional", "admin"]);

export const registerRoleSchema = z
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
        : role,
  );

export const registerAuthSchema = z
  .object({
    full_name: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirm_password: z.string(),
    phone: z
      .string()
      .trim()
      .transform(extractDigits)
      .refine(
        (phone) => phone.length === 11,
        "Telefone deve ter exatamente 11 digitos",
      ),
    role: registerRoleSchema,
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "As senhas devem ser iguais",
    path: ["confirm_password"],
  });

export const loginAuthSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export const updateAuthSchema = z
  .object({
    full_name: z.preprocess(emptyStringToUndefined, fullNameSchema.optional()),
    email: z.preprocess(emptyStringToUndefined, emailSchema.optional()),
    password: z.preprocess(emptyStringToUndefined, passwordSchema.optional()),
    phone: z.preprocess(
      emptyStringToNull,
      z
        .string()
        .trim()
        .transform((value) => (value === null ? value : extractDigits(value)))
        .refine(
          (phone) => phone === null || phone.length === 11,
          "Telefone deve ter exatamente 11 digitos",
        )
        .nullable()
        .optional(),
    ),
    avatar_url: z.preprocess(
      emptyStringToNull,
      z.string().url("Avatar deve ser uma URL valida").nullable().optional(),
    ),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Informe ao menos um campo para atualizacao",
  });

export const jwtPayloadSchema = z.object({
  id: z.string().uuid("JWT sem id valido"),
  email: z.string().email("JWT sem email valido"),
  role: databaseRoleSchema,
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type DatabaseUserRole = z.infer<typeof databaseRoleSchema>;

export type RegisterAuthInput = z.infer<typeof registerAuthSchema>;

export type LoginAuthInput = z.infer<typeof loginAuthSchema>;

export type UpdateAuthInput = z.infer<typeof updateAuthSchema>;

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
