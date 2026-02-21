"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useFavorites } from "@/lib/hooks";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Article {
  id: string;
  title: string;
  url: string;
  author: string;
  feed_title: string;
  summary_zh: string;
  tags: string[];
  content: string;
}

interface ArticleReaderProps {
  article: Article;
}

export function ArticleReader({ article }: ArticleReaderProps) {
  const { isFavorite, addFavorite, removeFavorite, isLoaded } = useFavorites();
  const favorited = isFavorite(article.id);

  const [user, setUser] = useState<User | null>(null);
  const [tier, setTier] = useState("free");
  const [note, setNote] = useState("");
  const [customSummary, setCustomSummary] = useState("");
  const [noteLoaded, setNoteLoaded] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (!data.user) return;
      setUser(data.user);

      Promise.resolve(
        supabase
          .from("profiles")
          .select("tier")
          .eq("id", data.user.id)
          .single()
      ).then(({ data: profile }) => {
          if (cancelled) return;
          if (profile) setTier(profile.tier);
        }).catch(() => {});

      // Load existing note
      fetch(`/api/user/notes?article_id=${article.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          if (data && data.note) setNote(data.note);
          if (data && data.custom_summary) setCustomSummary(data.custom_summary);
          setNoteLoaded(true);
        })
        .catch(() => setNoteLoaded(true));
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [article.id]);

  const saveNote = async () => {
    setNoteSaving(true);
    await fetch("/api/user/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        article_id: article.id,
        note: note || null,
        custom_summary: customSummary || null,
      }),
    });
    setNoteSaving(false);
  };

  const handleFavorite = () => {
    if (favorited) {
      removeFavorite(article.id);
    } else {
      addFavorite({
        id: article.id,
        title: article.title,
        url: article.url,
        feed_title: article.feed_title,
        summary_zh: article.summary_zh,
      });
    }
  };

  // Clean HTML content for display
  const cleanContent = article.content
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove style tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/home"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        ← 返回列表
      </Link>

      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{article.title}</h1>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {article.feed_title}
            {article.author && ` · ${article.author}`}
          </p>
          {isLoaded && (
            <button
              onClick={handleFavorite}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors ${
                favorited
                  ? "text-yellow-600 bg-yellow-50 hover:bg-yellow-100"
                  : "text-gray-500 bg-gray-100 hover:bg-gray-200"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill={favorited ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
              {favorited ? "已收藏" : "收藏"}
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      {/* AI Summary */}
      <div className="p-4 bg-blue-50 rounded-lg mb-8">
        <h2 className="text-sm font-medium text-blue-800 mb-2">AI 摘要</h2>
        <p className="text-blue-900">
          {customSummary || article.summary_zh}
        </p>
      </div>

      {/* User Notes (Pro only) */}
      {user && tier === "pro" && noteLoaded && (
        <div className="mb-8 border border-gray-200 rounded-lg">
          <button
            onClick={() => setShowNoteEditor(!showNoteEditor)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-600 hover:bg-gray-50"
          >
            <span>{note || customSummary ? "查看/编辑笔记" : "添加笔记"}</span>
            <svg
              className={`w-4 h-4 transition-transform ${showNoteEditor ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showNoteEditor && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  自定义摘要（替换 AI 摘要显示）
                </label>
                <textarea
                  value={customSummary}
                  onChange={(e) => setCustomSummary(e.target.value)}
                  rows={2}
                  placeholder="输入你自己的摘要..."
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  笔记
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="写下你的笔记..."
                  className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
              </div>
              <button
                onClick={saveNote}
                disabled={noteSaving}
                className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-500 disabled:opacity-50"
              >
                {noteSaving ? "保存中..." : "保存"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Original link */}
      <div className="mb-8">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          阅读原文
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>

      {/* Content */}
      <article
        className="prose prose-gray max-w-none
          prose-headings:text-gray-900
          prose-p:text-gray-700 prose-p:leading-relaxed
          prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
          prose-img:rounded-lg prose-img:mx-auto
          prose-pre:bg-gray-900 prose-pre:text-gray-100
          prose-code:text-pink-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded
          prose-blockquote:border-l-blue-500 prose-blockquote:bg-gray-50 prose-blockquote:py-1"
        dangerouslySetInnerHTML={{ __html: cleanContent }}
      />

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <Link href="/home" className="text-sm text-blue-600 hover:underline">
            ← 返回列表
          </Link>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            原文链接 ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
