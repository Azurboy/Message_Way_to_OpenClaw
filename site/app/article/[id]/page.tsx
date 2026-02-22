import { notFound } from "next/navigation";
import { getArchiveIndex, getArticleContent, getArticlesByDate } from "@/lib/content";
import { ArticleReader } from "./ArticleReader";
import { UserArticleFallback } from "./UserArticleFallback";

// Allow dynamic params (user articles not in static params will be rendered on demand)
export const dynamicParams = true;

// Generate static params for global articles
export function generateStaticParams() {
  const archive = getArchiveIndex();
  const allIds: { id: string }[] = [];

  archive.entries.forEach((entry) => {
    const data = getArticlesByDate(entry.date);
    if (data) {
      data.articles.forEach((article) => {
        allIds.push({ id: article.id });
      });
    }
  });

  return allIds;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;

  // Try to find in static content first
  const archive = getArchiveIndex();
  let articleMeta = null;

  for (const entry of archive.entries) {
    const data = getArticlesByDate(entry.date);
    if (data) {
      const found = data.articles.find((a) => a.id === id);
      if (found) {
        articleMeta = found;
        break;
      }
    }
  }

  if (articleMeta) {
    // Global article — serve from static content
    const content = getArticleContent(id);
    return (
      <ArticleReader
        article={{
          ...articleMeta,
          content: content?.content || "",
        }}
      />
    );
  }

  // Not a global article — render client component that fetches from Supabase
  return <UserArticleFallback articleId={id} />;
}
