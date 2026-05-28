import jwt from "jsonwebtoken";

import {
  jwtPayloadSchema,
  type JwtPayload,
} from "@/app/types/auth";

function getRequiredEnv(
  key: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET"
) {
  const value = process.env[key];

  if (!value) {
    throw new Error(
      `Variável de ambiente obrigatória ausente: ${key}`
    );
  }

  return value;
}

const ACCESS_SECRET =
  getRequiredEnv("JWT_ACCESS_SECRET");

const REFRESH_SECRET =
  getRequiredEnv("JWT_REFRESH_SECRET");

export function generateAccessToken(
  payload: Omit<JwtPayload, "iat" | "exp">
) {
  return jwt.sign(
    payload,
    ACCESS_SECRET,
    {
      expiresIn: "15m",
    }
  );
}

export function generateRefreshToken(
  payload: Omit<JwtPayload, "iat" | "exp">
) {
  return jwt.sign(
    payload,
    REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

export function verifyAccessToken(
  token: string
) {
  const decoded = jwt.verify(
    token,
    ACCESS_SECRET
  );

  return jwtPayloadSchema.parse(decoded);
}
