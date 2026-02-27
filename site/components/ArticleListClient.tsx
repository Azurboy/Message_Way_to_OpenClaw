"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
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

const PAGE_SIZE = 12;
const READ_KEY = "dailybit_read_ids";

function getReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    // Keep only latest 500 to avoid localStorage bloat
    const arr = [...ids].slice(-500);
    localStorage.setItem(READ_KEY, JSON.stringify(arr));
  } catch {}
}

function getViewMode(): "card" | "list" {
  if (typeof window === "undefined") return "card";
  return (localStorage.getItem("dailybit_view") as "card" | "list") || "card";
}

interface SearchResult {
  id: string;
  title: string;
  url: string;
  feed_title: string;
  summary_zh: string;
  tags: string[];
  date: string;
}

export function ArticleListClient({
  initialData,
  archiveEntries,
  allDatesData,
}: ArticleListClientProps) {
  const [selectedDate, setSelectedDate] = useState(initialData.date);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [userArticles, setUserArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Init client-side state
  useEffect(() => {
    setViewMode(getViewMode());
    setReadIds(getReadIds());
  }, []);

  // Fetch user's custom feed articles
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

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }, []);

  const toggleView = useCallback(() => {
    setViewMode((prev) => {
      const next = prev === "card" ? "list" : "card";
      localStorage.setItem("dailybit_view", next);
      return next;
    });
  }, []);

  // Search
  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results);
      }
    } catch {} finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults(null);
  }, []);

  // Current data
  const currentData = allDatesData[selectedDate] || initialData;

  // Merge global + user articles
  const mergedArticles = useMemo(() => {
    const globalArticles = currentData.articles.map((a) => ({
      ...a,
      _source: "global" as const,
    }));
    if (userArticles.length === 0) return globalArticles;
    if (selectedDate !== initialData.date) return globalArticles;
    const globalUrls = new Set(globalArticles.map((a) => a.url));
    const uniqueUserArticles = userArticles.filter((a) => !globalUrls.has(a.url));
    return [...globalArticles, ...uniqueUserArticles];
  }, [currentData, userArticles, selectedDate, initialData.date]);

  // Tag counts
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

  // Filter by tags (prefix matching for hierarchical tags)
  const filteredArticles = useMemo(() => {
    if (selectedTags.length === 0) return mergedArticles;
    return mergedArticles.filter((article) =>
      selectedTags.some((queryTag) =>
        article.tags.some(
          (t) =>
            t.toLowerCase() === queryTag.toLowerCase() ||
            t.toLowerCase().startsWith(queryTag.toLowerCase() + "/")
        )
      )
    );
  }, [mergedArticles, selectedTags]);

  // Pagination
  const totalPages = Math.ceil(filteredArticles.length / PAGE_SIZE);
  const pagedArticles = useMemo(
    () => filteredArticles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredArticles, page]
  );

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setPage(1);
  };

  const dates = archiveEntries.map((e) => ({ date: e.date, count: e.article_count }));
  const customCount = mergedArticles.filter((a) => a._source === "custom").length;

  // If showing search results
  if (searchResults !== null) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">DailyBit</h1>
          <SearchBar
            query={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            searching={searching}
          />
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            搜索 &quot;{searchQuery.trim()}&quot; 找到 {searchResults.length} 篇文章
          </span>
          <button onClick={clearSearch} className="text-sm text-blue-600 hover:underline">
            返回浏览
          </button>
        </div>
        <div className="space-y-4">
          {searchResults.length === 0 ? (
            <div className="text-center py-12 text-gray-500">没有匹配结果</div>
          ) : (
            searchResults.map((r) => (
              <article key={`${r.date}-${r.id}`} className="p-4 bg-white rounded-lg border border-gray-200">
                <Link href={`/article/${r.id}`} className="text-lg font-medium text-gray-900 hover:text-blue-600">
                  {r.title}
                </Link>
                <p className="text-sm text-gray-500 mt-1">
                  {r.feed_title} · {r.date}
                </p>
                <p className="text-gray-700 mt-2 text-sm">{r.summary_zh}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {r.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">DailyBit</h1>
        <p className="text-gray-600 mb-4">
          监控 92 个顶级技术博客，AI 为每篇生成中文摘要和标签
        </p>
        <SearchBar
          query={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          searching={searching}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <DateSelector
          dates={dates}
          selectedDate={selectedDate}
          onDateChange={(date) => {
            setSelectedDate(date);
            setSelectedTags([]);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>
            {filteredArticles.length} / {mergedArticles.length} 篇
            {customCount > 0 && (
              <span className="text-blue-500 ml-1">(含 {customCount} 篇自定义源)</span>
            )}
          </span>
          {/* View toggle */}
          <button
            onClick={toggleView}
            className="px-2 py-1 border border-gray-200 rounded text-xs hover:bg-gray-50"
            title={viewMode === "card" ? "切换列表视图" : "切换卡片视图"}
          >
            {viewMode === "card" ? "☰ 列表" : "▦ 卡片"}
          </button>
        </div>
      </div>

      {/* Tag Filter */}
      <div className="mb-6">
        <TagFilter
          tags={tagCounts}
          selectedTags={selectedTags}
          onTagToggle={handleTagToggle}
          onClear={() => { setSelectedTags([]); setPage(1); }}
        />
      </div>

      {/* Article List */}
      <div className={viewMode === "list" ? "space-y-1" : "space-y-4"}>
        {pagedArticles.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            没有匹配的文章，试试其他标签？
          </div>
        ) : (
          pagedArticles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              selectedTags={selectedTags}
              onTagClick={handleTagToggle}
              isCustom={article._source === "custom"}
              isRead={readIds.has(article.id)}
              onRead={markRead}
              viewMode={viewMode}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50"
          >
            上一页
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1]) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`px-3 py-1.5 text-sm rounded-lg ${
                    page === p
                      ? "bg-blue-600 text-white"
                      : "border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-30 hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between text-sm text-gray-500">
        <span>AI Model: {currentData.ai_model}</span>
        <span>{selectedDate}</span>
      </div>
    </div>
  );
}

// --- Search Bar ---

function SearchBar({
  query,
  onChange,
  onSearch,
  searching,
}: {
  query: string;
  onChange: (q: string) => void;
  onSearch: () => void;
  searching: boolean;
}) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onSearch()}
        placeholder="搜索文章标题、摘要、来源、标签..."
        className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        onClick={onSearch}
        disabled={searching || query.trim().length < 2}
        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
      >
        {searching ? "搜索中..." : "搜索"}
      </button>
    </div>
  );
}
