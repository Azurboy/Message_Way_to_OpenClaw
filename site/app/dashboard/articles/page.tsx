"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface UserArticle {
  id: string;
  title: string;
  url: string;
  feed_title: string | null;
  summary_zh: string | null;
  summary_long: string | null;
  tags: string[] | null;
  published_at: string | null;
  created_at: string;
}

export default function UserArticlesPage() {
  const [articles, setArticles] = useState<UserArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<string>("free");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (!data.user) {
        window.location.href = "/auth/login";
        return;
      }

      Promise.all([
        supabase
          .from("profiles")
          .select("tier")
          .eq("id", data.user.id)
          .single(),
        supabase
          .from("user_articles")
          .select("*")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]).then(([profileRes, articlesRes]) => {
        if (cancelled) return;
        setTier(profileRes.data?.tier ?? "free");
        setArticles(articlesRes.data ?? []);
        setLoading(false);
      }).catch(() => {});
    }).catch(() => {});

    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-20 text-center text-gray-500">
        加载中...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">我的文章</h1>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 返回仪表盘
        </Link>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-2">暂无文章</p>
          <p className="text-sm text-gray-400">
            添加自定义 RSS 源后，每日运行将自动生成摘要文章。
          </p>
          <Link
            href="/dashboard/feeds"
            className="mt-4 inline-block text-blue-600 hover:underline text-sm"
          >
            去添加 RSS 源 →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              tier={tier}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ArticleCard({ article, tier }: { article: UserArticle; tier: string }) {
  const [expanded, setExpanded] = useState(false);
  const hasLong = tier === "pro" && !!article.summary_long;

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gray-900 hover:text-blue-600 line-clamp-1"
          >
            {article.title}
          </a>
          {article.feed_title && (
            <p className="text-xs text-gray-400 mt-0.5">
              {article.feed_title}
            </p>
          )}
        </div>
        {article.published_at && (
          <time className="text-xs text-gray-400 whitespace-nowrap">
            {new Date(article.published_at).toLocaleDateString("zh-CN")}
          </time>
        )}
      </div>

      {/* Short summary — always visible */}
      {article.summary_zh && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-3">
          {article.summary_zh}
        </p>
      )}

      {/* Long summary — pro only, expandable */}
      {hasLong && (
        <div className="mt-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            {expanded ? "收起深度摘要" : "展开深度摘要"}
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {expanded && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {article.summary_long}
            </div>
          )}
        </div>
      )}

      {/* Upgrade hint for free users */}
      {tier === "free" && (
        <p className="mt-2 text-xs text-gray-400">
          <Link href="/pricing" className="text-blue-500 hover:underline">
            升级 Pro
          </Link>{" "}
          获取深度分析摘要
        </p>
      )}

      {article.tags && article.tags.length > 0 && (
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
