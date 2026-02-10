import Link from "next/link";
import { getArchiveIndex } from "@/lib/content";

export const dynamic = "force-static";
export const revalidate = false;

export default function ArchivePage() {
  const index = getArchiveIndex();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">归档</h1>
      {index.digests.length === 0 ? (
        <p className="text-gray-600">暂无历史摘要。</p>
      ) : (
        <ul className="space-y-3">
          {index.digests.map((entry) => (
            <li key={entry.date}>
              <Link
                href={`/digest/${entry.date}`}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <span className="font-medium">{entry.date}</span>
                <span className="text-sm text-gray-500">
                  {entry.post_count} 篇文章 · {entry.top_count} 篇精选
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
