import { NextResponse } from "next/server";

export const runtime = "edge";

export function GET() {
  return NextResponse.json({
    status: "ok",
    name: "BASE Tráfego Command",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}
