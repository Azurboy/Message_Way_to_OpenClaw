export const dynamic = "force-static";
export const revalidate = false;

export default function AboutPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">关于新启动 Daily</h1>

      <div className="space-y-4 text-gray-700 leading-relaxed">
        <p>
          <strong>新启动 Daily</strong> 是一个 AI 驱动的每日技术摘要服务。
          我们监控 92 个顶级技术博客的 RSS 源，通过 AI 筛选出最有价值的文章，
          并生成中文摘要。
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-3">工作原理</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>每天自动抓取 92 个技术博客的最新文章</li>
          <li>AI 对所有文章进行新闻价值评分</li>
          <li>选出 Top 15 最值得关注的文章</li>
          <li>生成结构化的中文摘要</li>
          <li>自动发布到本网站</li>
        </ol>

        <h2 className="text-xl font-semibold mt-8 mb-3">Agent 访问</h2>
        <p>本站专为 AI agent 设计了访问接口：</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><code className="bg-gray-100 px-1 rounded">/llms.txt</code> - Agent 发现文件</li>
          <li><code className="bg-gray-100 px-1 rounded">/llms-full.txt</code> - 完整最新摘要 (Markdown)</li>
          <li><code className="bg-gray-100 px-1 rounded">/api/digest/latest</code> - JSON API</li>
          <li><code className="bg-gray-100 px-1 rounded">/SKILL.md</code> - OpenClaw Skill 定义</li>
        </ul>

        <h2 className="text-xl font-semibold mt-8 mb-3">技术栈</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Pipeline: Python + feedparser + httpx + SiliconFlow AI</li>
          <li>网站: Next.js + Tailwind CSS</li>
          <li>部署: GitHub Actions + Vercel</li>
        </ul>
      </div>
    </div>
  );
}
