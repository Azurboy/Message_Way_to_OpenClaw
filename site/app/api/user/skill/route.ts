import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id");

  if (!userId) {
    return NextResponse.json(
      { error: "user_id query parameter is required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("custom_skill_md")
    .eq("id", userId)
    .single();

  if (!profile?.custom_skill_md) {
    // Redirect to global SKILL.md
    return NextResponse.redirect(new URL("/SKILL.md", request.url));
  }

  return new NextResponse(profile.custom_skill_md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
