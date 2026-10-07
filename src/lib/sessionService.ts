import crypto from "crypto";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const HEX_TOKEN_REGEX = /^[0-9a-f]{64}$/i;

export function generateRawToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function isValidTokenFormat(rawToken: string): boolean {
  return HEX_TOKEN_REGEX.test(rawToken);
}

export async function createDatabaseSession(
  dbClient: PrismaClient,
  userAccountId: string,
  rememberMe: boolean = true
): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = generateRawToken();
  const sessionTokenHash = hashToken(rawToken);
  const maxAgeSeconds = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);

  await dbClient.userSession.create({
    data: {
      sessionTokenHash,
      userAccountId,
      expiresAt,
    },
  });

  return { rawToken, expiresAt };
}

export function setSessionCookie(
  response: NextResponse,
  rawToken: string,
  rememberMe: boolean = true
): NextResponse {
  const maxAgeSeconds = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

  response.cookies.set({
    name: "jobseeker_session",
    value: rawToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: maxAgeSeconds,
    path: "/",
  });

  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: "jobseeker_session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
