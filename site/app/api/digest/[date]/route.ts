import { NextResponse } from "next/server";
import { getDigestByDate } from "@/lib/content";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const digest = getDigestByDate(date);
  if (!digest) {
    return NextResponse.json({ error: "Digest not found" }, { status: 404 });
  }
  return NextResponse.json(digest);
}
