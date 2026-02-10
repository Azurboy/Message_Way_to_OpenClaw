import { NextResponse } from "next/server";
import { getFeedsData } from "@/lib/content";

export async function GET() {
  const data = getFeedsData();
  if (!data) {
    return NextResponse.json({ error: "No feeds data available" }, { status: 404 });
  }
  return NextResponse.json(data);
}
