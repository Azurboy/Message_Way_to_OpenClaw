import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get("article_id");

  if (articleId) {
    // Get note for a specific article
    const { data } = await supabase
      .from("user_notes")
      .select("*")
      .eq("user_id", user.id)
      .eq("article_id", articleId)
      .single();

    return NextResponse.json(data);
  }

  // List all notes
  const { data, error } = await supabase
    .from("user_notes")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check tier
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();

  if (profile?.tier !== "pro") {
    return NextResponse.json(
      { error: "此功能需要 Pro 订阅" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { article_id, custom_summary, note } = body;

  if (!article_id) {
    return NextResponse.json(
      { error: "article_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("user_notes")
    .upsert(
      {
        user_id: user.id,
        article_id,
        custom_summary: custom_summary ?? null,
        note: note ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,article_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { article_id } = body;

  if (!article_id) {
    return NextResponse.json(
      { error: "article_id is required" },
      { status: 400 }
    );
  }

  await supabase
    .from("user_notes")
    .delete()
    .eq("user_id", user.id)
    .eq("article_id", article_id);

  return NextResponse.json({ ok: true });
}
