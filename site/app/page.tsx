import Link from "next/link";
import { getLatestDigest } from "@/lib/content";

export const dynamic = "force-static";
export const revalidate = false;

export default function Home() {
  const digest = getLatestDigest();

  if (!digest) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4">新启动 Daily</h1>
        <p className="text-gray-600">暂无摘要数据。Pipeline 运行后将自动生成。</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">新启动 Daily</h1>
        <p className="text-gray-600">
          {digest.date} · {digest.post_count} 篇文章 · {digest.top_count} 篇精选
        </p>
      </div>

      <article
        className="prose prose-gray max-w-none
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4
          [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3
          [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2
          [&_p]:mb-3 [&_p]:leading-relaxed
          [&_a]:text-blue-600 [&_a]:underline
          [&_li]:mb-1
          [&_strong]:font-semibold"
        dangerouslySetInnerHTML={{ __html: digest.summary_html }}
      />

      <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between text-sm text-gray-500">
        <span>AI Model: {digest.ai_model}</span>
        <Link href="/archive" className="text-blue-600 hover:underline">查看历史摘要 →</Link>
      </div>
    </div>
  );
}
