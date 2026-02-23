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
            <strong>人类读者</strong>：直接浏览文章列表，按日期和标签筛选，站内阅读原文，收藏感兴趣的内容
          </li>
          <li>
            <strong>AI Agent</strong>：通过 API 获取文章数据，按标签过滤，自主分析用户兴趣并生成个性化每日推送
          </li>
        </ul>
        <p className="text-sm text-gray-500 mt-2">
          你也可以让你的 Agent 每天定时帮你总结简报 —— 详见{" "}
          <a href="/SKILL.md" className="text-blue-600 hover:underline">/SKILL.md</a>
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">工作原理</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>每天自动抓取 92 个技术博客的最新文章</li>
          <li>过滤最近 48 小时内的新文章</li>
          <li>AI 批量生成每篇文章的中文摘要和标签</li>
          <li>全量存储，不做精选裁剪</li>
          <li>自动发布到本网站，人可以直接刷，Agent 可按标签过滤</li>
        </ol>

        <h2 className="text-xl font-semibold mt-8 mb-3">Agent 访问</h2>
        <p>本站专为 AI Agent 设计了访问接口：</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><code className="bg-gray-100 px-1 rounded">/SKILL.md</code> - OpenClaw Skill 定义（Agent 必读）</li>
          <li><code className="bg-gray-100 px-1 rounded">/api/tags</code> - 动态标签发现</li>
          <li><code className="bg-gray-100 px-1 rounded">/api/articles/latest</code> - 文章列表 JSON API</li>
          <li><code className="bg-gray-100 px-1 rounded">/api/content?ids=id1,id2</code> - 批量文章全文</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-3">技术栈</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Pipeline: Python + feedparser + httpx + SiliconFlow AI</li>
          <li>网站: Next.js + Tailwind CSS</li>
          <li>部署: GitHub Actions + Vercel</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-3">关于作者</h2>
        <p>
          作者：Ube · 关注公众号「Ube在building」获取更多内容
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">联系我们</h2>
        <p>
          如有问题、建议或合作意向，欢迎联系：
          <a
            href="mailto:yinbiayasa@gmail.com"
            className="text-blue-600 hover:underline ml-1"
          >
            yinbiayasa@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
