import { NextResponse } from "next/server";
import { getArchiveIndex } from "@/lib/content";

export async function GET() {
  return NextResponse.json(getArchiveIndex());
}
