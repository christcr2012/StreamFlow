import { NextResponse } from 'next/server';

export type ApiError = { code: string; message: string; details?: any };

export function jsonOk(data: any, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(status: number, code: string, message: string, details?: any) {
  return NextResponse.json({ ok: false, error: { code, message, details } as ApiError }, { status });
}

