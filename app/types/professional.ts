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

const uuidSchema = z.string().uuid("Id invalido");

const nullableTrimmedText = (
  min: number,
  max: number,
  message: string,
) =>
  z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .min(min, message)
      .max(max, message)
      .nullable()
      .optional(),
  );

const optionalIntegerField = (
  min: number,
  max: number,
  invalidMessage: string,
) =>
  z.preprocess(
    emptyStringToNull,
    z
      .union([
        z.number(),
        z.string().trim(),
        z.null(),
      ])
      .transform((value) =>
        value === null ? null : Number(value),
      )
      .refine(
        (value) =>
          value === null ||
          (Number.isInteger(value) &&
            value >= min &&
            value <= max),
        invalidMessage,
      )
      .nullable()
      .optional(),
  );

const optionalNumericField = (
  min: number,
  max: number,
  invalidMessage: string,
) =>
  z.preprocess(
    emptyStringToNull,
    z
      .union([
        z.number(),
        z.string().trim(),
        z.null(),
      ])
      .transform((value) =>
        value === null ? null : Number(value),
      )
      .refine(
        (value) =>
          value === null ||
          (!Number.isNaN(value) &&
            value >= min &&
            value <= max),
        invalidMessage,
      )
      .nullable()
      .optional(),
  );

const optionalBooleanField = z.preprocess(
  emptyStringToUndefined,
  z.boolean().optional(),
);

const optionalUrlField = z.preprocess(
  emptyStringToNull,
  z.string().url("Avatar deve ser uma URL valida").nullable().optional(),
);

const optionalPhoneField = z.preprocess(
  emptyStringToNull,
  z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine(
      (phone) => phone === "" || phone.length === 11,
      "Telefone deve ter exatamente 11 digitos",
    )
    .transform((phone) =>
      phone === "" ? null : phone,
    )
    .nullable()
    .optional(),
);

const optionalEmailField = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .email("Email invalido")
    .transform((email) => email.toLowerCase())
    .optional(),
);

const optionalFullNameField = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .trim()
    .min(3, "Nome deve ter pelo menos 3 caracteres")
    .regex(
      /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/,
      "Nome completo nao pode conter numeros nem caracteres especiais",
    )
    .optional(),
);

const optionalPasswordField = z.preprocess(
  emptyStringToUndefined,
  z
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
    })
    .optional(),
);

const ownerProfessionalFieldsSchema = z.object({
  business_name: nullableTrimmedText(
    2,
    120,
    "Nome comercial deve ter entre 2 e 120 caracteres",
  ),
  bio: z.preprocess(
    emptyStringToNull,
    z
      .string()
      .trim()
      .max(500, "Bio deve ter no maximo 500 caracteres")
      .nullable()
      .optional(),
  ),
  years_experience: optionalIntegerField(
    0,
    80,
    "Anos de experiencia deve ser um numero inteiro entre 0 e 80",
  ),
  city: nullableTrimmedText(
    2,
    120,
    "Cidade deve ter entre 2 e 120 caracteres",
  ),
  country: nullableTrimmedText(
    2,
    120,
    "Pais deve ter entre 2 e 120 caracteres",
  ),
  is_insured: optionalBooleanField,
  full_name: optionalFullNameField,
  email: optionalEmailField,
  password: optionalPasswordField,
  phone: optionalPhoneField,
  avatar_url: optionalUrlField,
});

const adminProfessionalFieldsSchema = z.object({
  profile_id: z.preprocess(
    emptyStringToUndefined,
    uuidSchema.optional(),
  ),
  is_verified: optionalBooleanField,
  tier_label: nullableTrimmedText(
    2,
    60,
    "Tier deve ter entre 2 e 60 caracteres",
  ),
  profile_strength: optionalIntegerField(
    0,
    100,
    "Profile strength deve ser um numero inteiro entre 0 e 100",
  ),
  avg_rating: optionalNumericField(
    0,
    5,
    "Avaliacao media deve ser um numero entre 0 e 5",
  ),
  total_reviews: optionalIntegerField(
    0,
    1000000,
    "Total de reviews deve ser um numero inteiro maior ou igual a 0",
  ),
  avg_response_hours: optionalIntegerField(
    0,
    1000000,
    "Tempo medio de resposta deve ser um numero inteiro maior ou igual a 0",
  ),
  plan_id: z.preprocess(
    emptyStringToNull,
    uuidSchema.nullable().optional(),
  ),
  location: z.preprocess(
    emptyStringToNull,
    z.string().trim().max(255).nullable().optional(),
  ),
});

function hasDefinedValues(data: Record<string, unknown>) {
  return Object.values(data).some(
    (value) => value !== undefined,
  );
}

export const professionalIdSchema = uuidSchema;

export const createProfessionalSchema =
  ownerProfessionalFieldsSchema.merge(
    adminProfessionalFieldsSchema,
  );

export const updateProfessionalSchema = ownerProfessionalFieldsSchema
  .merge(adminProfessionalFieldsSchema)
  .refine(hasDefinedValues, {
    message: "Informe ao menos um campo para atualizacao",
  });

export type CreateProfessionalInput = z.infer<
  typeof createProfessionalSchema
>;

export type UpdateProfessionalInput = z.infer<
  typeof updateProfessionalSchema
>;
