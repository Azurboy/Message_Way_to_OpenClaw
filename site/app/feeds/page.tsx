import { getFeedsData } from "@/lib/content";

export const dynamic = "force-static";
export const revalidate = false;

export default function FeedsPage() {
  const data = getFeedsData();

  if (!data) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-4">监控源列表</h1>
        <p className="text-gray-600">暂无数据。Pipeline 运行后将自动生成。</p>
      </div>
    );
  }

  const categories = new Map<string, typeof data.feeds>();
  for (const feed of data.feeds) {
    const cat = feed.category || "未分类";
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(feed);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">监控源列表</h1>
      <p className="text-gray-600 mb-8">{data.count} 个技术博客 · 更新于 {data.updated_at}</p>

      {Array.from(categories.entries()).map(([category, feeds]) => (
        <div key={category} className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-700">{category}</h2>
          <div className="grid gap-2">
            {feeds.map((feed) => (
              <div key={feed.xml_url} className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
                <span className="font-medium text-sm">{feed.title}</span>
                {feed.html_url && (
                  <a href={feed.html_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    访问 ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
