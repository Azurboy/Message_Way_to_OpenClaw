import { NextResponse } from "next/server";
import { getLatestDigest } from "@/lib/content";

export async function GET() {
  const digest = getLatestDigest();
  if (!digest) {
    return NextResponse.json({ error: "No digest available" }, { status: 404 });
  }
  return NextResponse.json(digest);
}
