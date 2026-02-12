"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArticleCard, TagFilter, DateSelector } from "@/components/ArticleCard";

interface Article {
  id: string;
  title: string;
  url: string;
  author: string;
  feed_title: string;
  summary_zh: string;
  tags: string[];
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

  // Get current data based on selected date
  const currentData = allDatesData[selectedDate] || initialData;

  // Calculate tag counts for current date
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    currentData.articles.forEach((article) => {
      article.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [currentData]);

  // Filter articles by selected tags
  const filteredArticles = useMemo(() => {
    if (selectedTags.length === 0) return currentData.articles;
    return currentData.articles.filter((article) =>
      selectedTags.some((tag) => article.tags.includes(tag))
    );
  }, [currentData, selectedTags]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const dates = archiveEntries.map((e) => ({ date: e.date, count: e.article_count }));

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
            {filteredArticles.length} / {currentData.article_count} 篇文章
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
