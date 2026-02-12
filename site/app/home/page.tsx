import { getLatestArticles, getArchiveIndex, getArticlesByDate } from "@/lib/content";
import { ArticleListClient } from "@/components/ArticleListClient";

export const dynamic = "force-static";
export const revalidate = false;

export default function HomePage() {
  const data = getLatestArticles();
  const archive = getArchiveIndex();

  if (!data) {
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold mb-4">DailyBit</h1>
        <p className="text-gray-600">暂无文章数据。Pipeline 运行后将自动生成。</p>
      </div>
    );
  }

  // Pre-load all dates data for client-side switching
  const allDatesData: Record<string, typeof data> = {};
  archive.entries.forEach((entry) => {
    const dateData = getArticlesByDate(entry.date);
    if (dateData) {
      allDatesData[entry.date] = dateData;
    }
  });

  return (
    <ArticleListClient
      initialData={data}
      archiveEntries={archive.entries}
      allDatesData={allDatesData}
    />
  );
}
