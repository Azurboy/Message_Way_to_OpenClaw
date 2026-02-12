import { notFound } from "next/navigation";
import { getLatestArticles, getArticleContent, getArchiveIndex, getArticlesByDate } from "@/lib/content";
import { ArticleReader } from "./ArticleReader";

export const dynamic = "force-static";
export const revalidate = false;

// Generate static params for all articles
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

  // Find article metadata from all dates
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

  if (!articleMeta) {
    notFound();
  }

  // Get full content
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
