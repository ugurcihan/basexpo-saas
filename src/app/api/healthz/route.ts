import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      ts: new Date().toISOString(),
      version: "0.1.0",
      phase: "0",
    },
    { status: 200 }
  );
}
