import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM = "Ube from DailyBit <ube@dailybit.cc>";

serve(async (req) => {
  try {
    const payload = await req.json();
    const { type, table, record, old_record } = payload;

    // Only trigger on UPDATE to auth.users
    if (type !== "UPDATE" || table !== "users") {
      return new Response(JSON.stringify({ message: "ignored" }), {
        status: 200,
      });
    }

    // Only fire when email_confirmed_at changes from null to non-null
    const wasConfirmed = old_record?.email_confirmed_at;
    const nowConfirmed = record?.email_confirmed_at;
    if (wasConfirmed || !nowConfirmed) {
      return new Response(
        JSON.stringify({ message: "not a new confirmation" }),
        { status: 200 }
      );
    }

    const email = record.email;
    if (!email) {
      return new Response(JSON.stringify({ message: "no email" }), {
        status: 200,
      });
    }

    // Extract display name: GitHub full_name > GitHub user_name > email prefix
    const meta = record.raw_user_meta_data || {};
    const name =
      meta.full_name || meta.user_name || email.split("@")[0] || "朋友";

    // Schedule email 30 minutes from now
    const sendAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const html = buildEmailHtml(name);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: email,
        subject: `Hi ${name}，来自 DailyBit 开发者的一封信`,
        html,
        scheduledAt: sendAt,
      }),
    });

    const data = await res.json();
    console.log("Resend response:", JSON.stringify(data));

    return new Response(
      JSON.stringify({ message: "scheduled", sendAt, data }),
      { status: 200 }
    );
  } catch (e) {
    console.error("Welcome email error:", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});

function buildEmailHtml(name: string): string {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
<head>
  <meta content="width=device-width" name="viewport" />
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta content="IE=edge" http-equiv="X-UA-Compatible" />
  <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
</head>
<body>
  <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0" data-skip-in-text="true">这是一封欢迎信</div>
  <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Oxygen','Ubuntu','Cantarell','Fira Sans','Droid Sans','Helvetica Neue',sans-serif;font-size:1.077em;min-height:100%;line-height:155%">
    <tbody>
      <tr>
        <td>
          <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;padding-left:0;padding-right:0;line-height:155%;max-width:600px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Oxygen','Ubuntu','Cantarell','Fira Sans','Droid Sans','Helvetica Neue',sans-serif">
            <tbody>
              <tr>
                <td>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">
                    <span>Hi </span>${name}<span> ！</span>
                  </p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><br /></p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">
                    <span>我是 DailyBit 的独立开发者，你可以叫我</span><span style="color:#9333EA"><strong>Ube</strong></span><span>！源自于\u201c香芋\u201d的英文。</span>
                  </p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><br /></p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">
                    <span>非常感谢你成为我最早期的用户之一！</span>
                  </p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><br /></p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">
                    <span>做这个网站的初衷非常个人化：现在的科技资讯圈太吵了。无论是 LLM 生成的注水文章，还是为了流量制造的标题党，都在严重消耗我们的注意力。我真正想看的，是一些技术论坛的深度讨论，或者是一些顶尖开发者的输出。</span>
                  </p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><br /></p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">
                    <span>所以我写了 DailyBit。它很纯粹：每天从 92 个高质量技术博客中抓取最新内容，AI 生成中文摘要，不做广告、不做推荐算法，只做内容本身。</span>
                  </p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><br /></p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">
                    <span>作为一个刚刚上线几天的 MVP，它一定还很粗糙，甚至可能有各种 Bug。</span>
                  </p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><br /></p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">
                    <span>这正是我写这封邮件的原因。我非常需要你的客观批评：</span>
                  </p>
                  <ul style="margin:0;padding:0;padding-left:1.1em;padding-bottom:1em">
                    <li style="margin:0;padding:0;margin-left:1em;margin-bottom:0.3em;margin-top:0.3em">
                      <p style="margin:0;padding:0"><span>有哪些你私藏的高质量 RSS 博客，希望被加入白名单？</span></p>
                    </li>
                    <li style="margin:0;padding:0;margin-left:1em;margin-bottom:0.3em;margin-top:0.3em">
                      <p style="margin:0;padding:0"><span>如果你在用 Agent 接入我们的 API，遇到了什么痛点？</span></p>
                    </li>
                    <li style="margin:0;padding:0;margin-left:1em;margin-bottom:0.3em;margin-top:0.3em">
                      <p style="margin:0;padding:0"><span>有什么你想通过这个网站获得却没实现的东西？</span></p>
                    </li>
                    <li style="margin:0;padding:0;margin-left:1em;margin-bottom:0.3em;margin-top:0.3em">
                      <p style="margin:0;padding:0"><span>以及任何你觉得想添加的功能、吐槽的bug......</span></p>
                    </li>
                  </ul>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><br /></p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">
                    <span>后续这个网站的迭代方向将继续向</span><span><strong>高质量内容</strong></span><span>演化：</span>
                  </p>
                  <ul style="margin:0;padding:0;padding-left:1.1em;padding-bottom:1em">
                    <li style="margin:0;padding:0;margin-left:1em;margin-bottom:0.3em;margin-top:0.3em">
                      <p style="margin:0;padding:0"><span>更精准的 AI 摘要和个性化推荐</span></p>
                    </li>
                    <li style="margin:0;padding:0;margin-left:1em;margin-bottom:0.3em;margin-top:0.3em">
                      <p style="margin:0;padding:0"><span>打造 RSS 源广场，让你不知道关注什么内容时可以根据兴趣一键关注</span></p>
                    </li>
                    <li style="margin:0;padding:0;margin-left:1em;margin-bottom:0.3em;margin-top:0.3em">
                      <p style="margin:0;padding:0"><span>聚合小红书、X、即刻、知乎等更多不同维度的信息源</span></p>
                    </li>
                    <li style="margin:0;padding:0;margin-left:1em;margin-bottom:0.3em;margin-top:0.3em">
                      <p style="margin:0;padding:0"><span>......</span></p>
                    </li>
                  </ul>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><br /></p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">
                    <span><u><strong>我想要让 </strong></u></span><span><u><strong><a href="https://dailybit.cc" style="color:#0670DB;text-decoration:underline" target="_blank">DailyBit.cc</a></strong></u></span><span><u><strong> 变成 Agent 时代最高质量的内容网站。</strong></u></span>
                  </p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><br /></p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">
                    <span><strong>你可以直接回复这封邮件。</strong></span><span> 每一封回信我都会亲自阅读，你的痛点将直接影响下一版的优先级。</span>
                  </p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><br /></p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">
                    <span>春天到了，顺颂时祺</span>
                  </p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em;text-align:right">
                    <span> Ube \u2014\u2014DailyBit 开发者</span>
                  </p>
                  <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="font-size:0.8em">
                    <tbody>
                      <tr>
                        <td>
                          <hr style="width:100%;border:none;border-top:1px solid #eaeaea;padding-bottom:1em" />
                          <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">
                            <span>You are receiving this email because you signed up at DailyBit.cc.</span>
                          </p>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
}
