/**
 * Gmail OAuth (gmail.send) adapter for provider-level emails
 */

import { getKVClient } from "@cortiware/kv";
import { encrypt, decrypt } from "@/lib/encryption";

const GMAIL_REFRESH_KEY = "provider:email:gmail:refresh";
const GMAIL_EMAIL_KEY = "provider:email:gmail:email";

function required(name: string, v?: string) {
  if (!v) throw new Error(`${name} is required`);
  return v;
}

function getOAuthConfig(reqOrigin?: string) {
  const clientId = required("GOOGLE_CLIENT_ID", process.env.GOOGLE_CLIENT_ID);
  const clientSecret = required(
    "GOOGLE_CLIENT_SECRET",
    process.env.GOOGLE_CLIENT_SECRET,
  );
  const base =
    reqOrigin ||
    process.env.NEXT_PUBLIC_PROVIDER_URL ||
    process.env.NEXT_PUBLIC_APP_URL;
  const redirectUri = `${required("Redirect Base URL", base)}/api/provider/email/connect/callback`;
  return { clientId, clientSecret, redirectUri };
}

export async function saveRefreshToken(refreshToken: string, email?: string) {
  const kv = getKVClient();
  await kv.set(GMAIL_REFRESH_KEY, encrypt(refreshToken));
  if (email) await kv.set(GMAIL_EMAIL_KEY, email);
}

export async function getConnectedEmail(): Promise<string | null> {
  const kv = getKVClient();
  return (await kv.get<string>(GMAIL_EMAIL_KEY)) || null;
}

export async function hasRefreshToken(): Promise<boolean> {
  const kv = getKVClient();
  const enc = await kv.get<string>(GMAIL_REFRESH_KEY);
  return !!enc;
}

async function getRefreshTokenDecrypted(): Promise<string | null> {
  const kv = getKVClient();
  const enc = await kv.get<string>(GMAIL_REFRESH_KEY);
  return enc ? decrypt(enc) : null;
}

export async function getAccessToken(reqOrigin?: string): Promise<string> {
  const refreshToken = await getRefreshTokenDecrypted();
  if (!refreshToken) throw new Error("Gmail not connected");
  const { clientId, clientSecret } = getOAuthConfig(reqOrigin);
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || "Failed to refresh access token");
  return j.access_token as string;
}

function toBase64Url(input: string) {
  // Security: Use non-backtracking replace to avoid ReDoS on pathological inputs
  let result = Buffer.from(input).toString("base64");
  result = result.replace(/\+/g, "-").replace(/\//g, "_");
  // Remove trailing '=' padding without regex backtracking
  while (result.endsWith("=")) {
    result = result.slice(0, -1);
  }
  return result;
}

export async function sendGmail(params: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  fromName?: string;
  reqOrigin?: string;
}) {
  const accessToken = await getAccessToken(params.reqOrigin);
  const fromEmail = (await getConnectedEmail()) || "me";
  const fromName = params.fromName || "Provider";

  const raw =
    `From: ${fromName} <${fromEmail}>\r\n` +
    `To: ${params.to}\r\n` +
    `Subject: ${params.subject}\r\n` +
    `MIME-Version: 1.0\r\n` +
    `Content-Type: ${params.html ? "text/html" : "text/plain"}; charset=UTF-8\r\n\r\n` +
    `${params.html ?? params.text ?? ""}`;

  const body = { raw: toBase64Url(raw) };

  const res = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(j.error?.message || "Failed to send email via Gmail");
  }
  return j;
}

export function buildAuthUrl(state: string, reqOrigin?: string) {
  const { clientId, redirectUri } = getOAuthConfig(reqOrigin);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set(
    "scope",
    "https://www.googleapis.com/auth/gmail.send openid email profile",
  );
  url.searchParams.set("state", state);
  return url.toString();
}

export async function exchangeCodeForTokens(
  code: string,
  reqOrigin?: string,
): Promise<{
  access_token: string;
  refresh_token?: string;
  id_token?: string;
}> {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig(reqOrigin);
  const params = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || "Failed to exchange code");
  return j;
}
