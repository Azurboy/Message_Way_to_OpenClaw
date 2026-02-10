import Link from "next/link";
import { getDigestByDate, getArchiveIndex } from "@/lib/content";
import { notFound } from "next/navigation";

export const dynamic = "force-static";
export const revalidate = false;

export async function generateStaticParams() {
  const index = getArchiveIndex();
  return index.digests.map((entry) => ({ date: entry.date }));
}

export default async function DigestPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const digest = getDigestByDate(date);

  if (!digest) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/archive" className="text-sm text-blue-600 hover:underline">← 归档</Link>
        <h1 className="text-3xl font-bold mt-2 mb-2">新启动 Daily - {digest.date}</h1>
        <p className="text-gray-600">
          {digest.post_count} 篇文章 · {digest.top_count} 篇精选
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

      <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-500">
        <span>AI Model: {digest.ai_model} · Tokens: {digest.tokens_used}</span>
      </div>
    </div>
  );
}
