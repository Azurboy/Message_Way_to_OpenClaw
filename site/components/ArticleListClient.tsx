"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ArticleCard, TagFilter, DateSelector } from "@/components/ArticleCard";
import { createClient } from "@/lib/supabase/client";

interface Article {
  id: string;
  title: string;
  url: string;
  author: string;
  feed_title: string;
  summary_zh: string;
  tags: string[];
  _source?: "global" | "custom";
}

interface ArticlesData {
  date: string;
  article_count: number;
  ai_model: string;
  articles: Article[];
}

interface ArchiveEntry {
  date: string;
  article_count: number;
}

interface ArticleListClientProps {
  initialData: ArticlesData;
  archiveEntries: ArchiveEntry[];
  allDatesData: Record<string, ArticlesData>;
}

export function ArticleListClient({
  initialData,
  archiveEntries,
  allDatesData,
}: ArticleListClientProps) {
  const [selectedDate, setSelectedDate] = useState(initialData.date);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [userArticles, setUserArticles] = useState<Article[]>([]);

  // Fetch user's custom feed articles on mount
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return;

      supabase
        .from("user_articles")
        .select("id, title, url, feed_title, summary_zh, tags, published_at")
        .eq("user_id", data.user.id)
        .order("published_at", { ascending: false })
        .limit(100)
        .then(({ data: articles }) => {
          if (cancelled || !articles) return;
          setUserArticles(
            articles.map((a: Record<string, unknown>) => ({
              id: a.id as string,
              title: a.title as string,
              url: a.url as string,
              author: "",
              feed_title: (a.feed_title as string) || "",
              summary_zh: (a.summary_zh as string) || "",
              tags: (a.tags as string[]) || [],
              _source: "custom" as const,
            }))
          );
        });
    }).catch(() => {});

    return () => { cancelled = true; };
  }, []);

  // Get current data based on selected date
  const currentData = allDatesData[selectedDate] || initialData;

  // Merge global + user articles, deduplicate by URL
  const mergedArticles = useMemo(() => {
    const globalArticles = currentData.articles.map((a) => ({
      ...a,
      _source: "global" as const,
    }));

    if (userArticles.length === 0) return globalArticles;

    // Only show user articles on the latest date
    if (selectedDate !== initialData.date) return globalArticles;

    const globalUrls = new Set(globalArticles.map((a) => a.url));
    const uniqueUserArticles = userArticles.filter(
      (a) => !globalUrls.has(a.url)
    );

    return [...globalArticles, ...uniqueUserArticles];
  }, [currentData, userArticles, selectedDate, initialData.date]);

  // Calculate tag counts
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mergedArticles.forEach((article) => {
      article.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [mergedArticles]);

  // Filter articles by selected tags
  const filteredArticles = useMemo(() => {
    if (selectedTags.length === 0) return mergedArticles;
    return mergedArticles.filter((article) =>
      selectedTags.some((tag) => article.tags.includes(tag))
    );
  }, [mergedArticles, selectedTags]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const dates = archiveEntries.map((e) => ({ date: e.date, count: e.article_count }));
  const customCount = mergedArticles.filter((a) => a._source === "custom").length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">DailyBit</h1>
        <p className="text-gray-600">
          监控 92 个顶级技术博客，AI 为每篇生成中文摘要和标签
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <DateSelector
          dates={dates}
          selectedDate={selectedDate}
          onDateChange={(date) => {
            setSelectedDate(date);
            setSelectedTags([]); // Reset tags when changing date
          }}
        />
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>
            {filteredArticles.length} / {mergedArticles.length} 篇文章
            {customCount > 0 && (
              <span className="text-blue-500 ml-1">
                (含 {customCount} 篇自定义源)
              </span>
            )}
          </span>
          <Link href="/favorites" className="text-blue-600 hover:underline">
            我的收藏 →
          </Link>
        </div>
      </div>

      {/* Tag Filter */}
      <div className="mb-6">
        <TagFilter
          tags={tagCounts}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          onClear={() => setSelectedTags([])}
        />
      </div>

      {/* Article List */}
      <div className="space-y-4">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            没有匹配的文章，试试其他标签？
          </div>
        ) : (
          filteredArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              selectedTags={selectedTags}
              onTagClick={handleTagToggle}
              isCustom={article._source === "custom"}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between text-sm text-gray-500">
        <span>AI Model: {currentData.ai_model}</span>
        <span>{selectedDate}</span>
      </div>
    </div>
  );
}
