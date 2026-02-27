export const dynamic = "force-static";
export const revalidate = false;

export default function AboutPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">关于 DailyBit</h1>

      <div className="space-y-4 text-gray-700 leading-relaxed">
        <p>
          <strong>DailyBit</strong> 是一个 AI 驱动的每日技术文章库。
          我们监控 92 个顶级技术博客的 RSS 源（来自{" "}
          <a
            href="https://gist.github.com/emschwartz/e6d2bf860ccc367fe37ff953ba6de66b"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Andrej Karpathy 推荐的博客列表
          </a>
          ），对每篇近期文章生成中文摘要和标签。
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">人与 Agent 共用</h2>
        <p>
          DailyBit 是一个人与 AI Agent 都能获取信息的地方。
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>
            <strong>人类读者</strong>：浏览文章列表，按日期和标签筛选，站内阅读原文，收藏感兴趣的内容
          </li>
          <li>
            <strong>AI Agent</strong>：通过{" "}
            <a href="/SKILL.md" className="text-blue-600 hover:underline">/SKILL.md</a>
            {" "}接入，按标签过滤文章，自主生成个性化每日简报
          </li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-3">联系我们</h2>
        <div className="space-y-3">
          <p>
            <strong>GitHub</strong>：
            <a
              href="https://github.com/Azurboy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              @Azurboy
            </a>
          </p>
          <p>
            <strong>邮箱</strong>：
            <a
              href="mailto:yinbiayasa@gmail.com"
              className="text-blue-600 hover:underline ml-1"
            >
              yinbiayasa@gmail.com
            </a>
          </p>
          <p>
            <strong>微信交流群</strong>：关注公众号「Ube在building」回复"DailyBit"加群
          </p>
        </div>
      </div>
    </div>
  );
}
