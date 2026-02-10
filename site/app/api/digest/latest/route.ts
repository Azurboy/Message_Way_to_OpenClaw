import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.redirect(
    new URL(`/api/articles/latest${url.search}`, request.url),
    301
  );
}
