import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = "DailyBit <welcome@dailybit.cc>";

serve(async (req) => {
  try {
    const payload = await req.json();

    // Database webhook sends: { type, table, record, schema, old_record }
    const { type, table, record } = payload;

    if (type !== "INSERT" || table !== "users") {
      return new Response(JSON.stringify({ message: "ignored" }), {
        status: 200,
      });
    }

    const email = record.email;
    if (!email) {
      return new Response(JSON.stringify({ message: "no email" }), {
        status: 200,
      });
    }

    const meta = record.raw_user_meta_data || {};
    const name =
      meta.full_name || meta.user_name || email.split("@")[0] || "there";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: email,
        subject: `${name}，欢迎加入 DailyBit`,
        html: `
<div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;line-height:1.6">
  <h1 style="font-size:24px;margin-bottom:16px">Hi ${name}，</h1>
  <p>欢迎加入 <strong>DailyBit</strong>！</p>
  <p>
    我们每天从 92 个顶级技术博客中抓取最新文章，AI 自动生成中文摘要和标签。
    你可以直接浏览，也可以让 AI Agent 帮你生成个性化每日简报。
  </p>

  <h2 style="font-size:18px;margin-top:24px">快速上手</h2>
  <ul style="padding-left:20px">
    <li><strong>浏览文章</strong> — 按标签和日期筛选，站内阅读原文</li>
    <li><strong>添加订阅源</strong> — 在「我的订阅源」中添加你关注的博客</li>
    <li><strong>Agent 接入</strong> — 生成 API Token，让你的 AI Agent 自动帮你选文章</li>
  </ul>

  <div style="margin:32px 0">
    <a href="https://dailybit.cc/home"
       style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:500">
      开始探索
    </a>
  </div>

  <p style="color:#6b7280;font-size:14px">
    有任何问题或建议，欢迎回复此邮件或联系
    <a href="mailto:yinbiayasa@gmail.com" style="color:#2563eb">yinbiayasa@gmail.com</a>。
  </p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
  <p style="color:#9ca3af;font-size:12px">
    DailyBit · 高质量技术博客 AI 中文日报
  </p>
</div>`.trim(),
      }),
    });

    const data = await res.json();
    console.log("Resend response:", data);

    return new Response(JSON.stringify({ message: "sent", data }), {
      status: 200,
    });
  } catch (e) {
    console.error("Welcome email error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
