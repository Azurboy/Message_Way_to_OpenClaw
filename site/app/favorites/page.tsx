"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/hooks";

export default function FavoritesPage() {
  const { favorites, removeFavorite, isLoaded } = useFavorites();

  if (!isLoaded) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">我的收藏</h1>
        <p className="text-gray-600">
          {favorites.length} 篇文章 · 数据保存在浏览器本地
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
          <p className="text-gray-500 mb-4">还没有收藏任何文章</p>
          <Link
            href="/home"
            className="inline-flex items-center px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            去看看今日文章 →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {favorites
            .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
            .map((article) => (
              <article
                key={article.id}
                className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/article/${article.id}`}
                      className="text-lg font-medium text-gray-900 hover:text-blue-600"
                    >
                      {article.title}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">{article.feed_title}</p>
                  </div>
                  <button
                    onClick={() => removeFavorite(article.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="取消收藏"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-gray-700 mt-2 text-sm leading-relaxed">
                  {article.summary_zh}
                </p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 text-xs">
                  <Link href={`/article/${article.id}`} className="text-blue-600 hover:underline">
                    站内阅读 →
                  </Link>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    原文链接 ↗
                  </a>
                  <span className="text-gray-400 ml-auto">
                    收藏于 {new Date(article.savedAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </article>
            ))}
        </div>
      )}

      <div className="mt-12 pt-6 border-t border-gray-200">
        <Link href="/home" className="text-sm text-blue-600 hover:underline">
          ← 返回首页
        </Link>
      </div>
    </div>
  );
}
