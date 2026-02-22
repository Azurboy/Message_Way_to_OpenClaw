"use client";

import { useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArticleReader } from "./ArticleReader";

interface UserArticleFallbackProps {
  articleId: string;
}

export function UserArticleFallback({ articleId }: UserArticleFallbackProps) {
  const [article, setArticle] = useState<null | {
    id: string;
    title: string;
    url: string;
    author: string;
    feed_title: string;
    summary_zh: string;
    tags: string[];
    content: string;
  }>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (!data.user) {
        setNotFoundState(true);
        setLoading(false);
        return;
      }

      supabase
        .from("user_articles")
        .select("id, title, url, feed_title, summary_zh, tags, content_html")
        .eq("id", articleId)
        .eq("user_id", data.user.id)
        .single()
        .then(({ data: row, error }) => {
          if (cancelled) return;
          if (error || !row) {
            setNotFoundState(true);
          } else {
            setArticle({
              id: row.id,
              title: row.title,
              url: row.url,
              author: "",
              feed_title: row.feed_title || "",
              summary_zh: row.summary_zh || "",
              tags: row.tags || [],
              content: row.content_html || "",
            });
          }
          setLoading(false);
        });
    }).catch(() => {
      if (!cancelled) {
        setNotFoundState(true);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [articleId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-20 text-center text-gray-500">
        加载中...
      </div>
    );
  }

  if (notFoundState || !article) {
    notFound();
  }

  return <ArticleReader article={article} />;
}
