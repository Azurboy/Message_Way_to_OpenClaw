import Link from "next/link";
import { getLatestArticles } from "@/lib/content";

export const dynamic = "force-static";
export const revalidate = false;

export default function Home() {
  const data = getLatestArticles();

  if (!data) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4">新启动 Daily</h1>
        <p className="text-gray-600">暂无文章数据。Pipeline 运行后将自动生成。</p>
      </div>
    );
  }

  return (
    <div>
      {/* Agent discovery banner - visible in HTML, helps LLM agents find the API */}
      <section className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800" data-agent-hint="true">
        <p className="font-medium mb-1">AI Agent? Read <code className="bg-blue-100 px-1 rounded">/SKILL.md</code> FIRST for mandatory behavioral rules, then use the API:</p>
        <ul className="space-y-0.5 text-blue-700">
          <li>Step 1: <code className="bg-blue-100 px-1 rounded">GET /SKILL.md</code> — read rules on context-first inference, curation, trend synthesis</li>
          <li>Step 2: <code className="bg-blue-100 px-1 rounded">GET /api/articles/latest?tags=AI,LLM</code> — filter articles by inferred user interests</li>
        </ul>
      </section>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">新启动 Daily</h1>
        <p className="text-gray-600">
          {data.date} · {data.article_count} 篇文章（全量 + AI 摘要）
        </p>
      </div>

      <div className="space-y-4">
        {data.articles.map((article) => (
          <article
            key={article.id}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-medium text-gray-900 hover:text-blue-600"
                >
                  {article.title}
                </a>
                <p className="text-sm text-gray-500 mt-1">
                  {article.feed_title}
                  {article.author && ` · ${article.author}`}
                </p>
              </div>
            </div>
            <p className="text-gray-700 mt-2 text-sm leading-relaxed">
              {article.summary_zh}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between text-sm text-gray-500">
        <span>AI Model: {data.ai_model}</span>
        <Link href="/archive" className="text-blue-600 hover:underline">查看历史 →</Link>
      </div>
    </div>
  );
}
