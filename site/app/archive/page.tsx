import Link from "next/link";
import { getArchiveIndex } from "@/lib/content";

export const dynamic = "force-static";
export const revalidate = false;

export default function ArchivePage() {
  const index = getArchiveIndex();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">归档</h1>
      {index.entries.length === 0 ? (
        <p className="text-gray-600">暂无历史数据。</p>
      ) : (
        <ul className="space-y-3">
          {index.entries.map((entry) => (
            <li key={entry.date}>
              <Link
                href={`/articles/${entry.date}`}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <span className="font-medium">{entry.date}</span>
                <span className="text-sm text-gray-500">
                  {entry.article_count} 篇文章
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
