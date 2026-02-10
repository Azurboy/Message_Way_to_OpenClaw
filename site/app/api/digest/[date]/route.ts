import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  const { date } = await params;
  const url = new URL(request.url);
  return NextResponse.redirect(
    new URL(`/api/articles/${date}${url.search}`, request.url),
    301
  );
}
