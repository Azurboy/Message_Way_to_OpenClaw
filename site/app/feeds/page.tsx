"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface FeedItem {
  type: "default" | "custom";
  id: string;
  feed_url: string;
  feed_title: string | null;
  html_url?: string;
  category?: string;
}

interface StaticFeed {
  title: string;
  xml_url: string;
  html_url: string;
  category: string;
}

export default function FeedsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [staticFeeds, setStaticFeeds] = useState<StaticFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Load auth state
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (cancelled) return;
        setUser(data.user);
        setAuthReady(true);
      })
      .catch(() => {
        if (!cancelled) setAuthReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load feeds based on auth state
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;

    if (user) {
      // Logged in: load merged list from API
      fetch("/api/user/feeds")
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          if (Array.isArray(data)) setFeeds(data);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    } else {
      // Not logged in: load static defaults
      fetch("/api/feeds")
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          if (data?.feeds) setStaticFeeds(data.feeds);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [user, authReady]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!url.trim()) return;

    setAdding(true);
    try {
      const res = await fetch("/api/user/feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feed_url: url.trim(),
          feed_title: title.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "添加失败");
      } else {
        const newFeed = await res.json();
        setFeeds((prev) => [...prev, newFeed]);
        setUrl("");
        setTitle("");
      }
    } catch {
      setError("网络错误");
    }
    setAdding(false);
  };

  const handleDelete = async (feed: FeedItem) => {
    // Optimistic removal
    setFeeds((prev) => prev.filter((f) => f.id !== feed.id));
    await fetch("/api/user/feeds", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: feed.type, id: feed.id }),
    });
  };

  const defaultFeeds = feeds.filter((f) => f.type === "default");
  const customFeeds = feeds.filter((f) => f.type === "custom");

  const filteredDefaults = search.trim()
    ? defaultFeeds.filter(
        (f) =>
          (f.feed_title ?? "").toLowerCase().includes(search.toLowerCase()) ||
          f.feed_url.toLowerCase().includes(search.toLowerCase())
      )
    : defaultFeeds;

  const filteredCustom = search.trim()
    ? customFeeds.filter(
        (f) =>
          (f.feed_title ?? "").toLowerCase().includes(search.toLowerCase()) ||
          f.feed_url.toLowerCase().includes(search.toLowerCase())
      )
    : customFeeds;

  const filteredStatic = search.trim()
    ? staticFeeds.filter(
        (f) =>
          f.title.toLowerCase().includes(search.toLowerCase()) ||
          f.xml_url.toLowerCase().includes(search.toLowerCase())
      )
    : staticFeeds;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto mt-20 text-center text-gray-500">
        加载中...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">
        {user ? "我的订阅源" : "监控源列表"}
      </h1>
      <p className="text-gray-600 mb-6">
        {user
          ? `${defaultFeeds.length} 个预设源 · ${customFeeds.length} 个自定义源`
          : `${staticFeeds.length} 个默认源 · 登录后可自定义`}
      </p>

      {/* Search */}
      <input
        type="text"
        placeholder="搜索源..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Add form (logged in only) */}
      {user && (
        <form onSubmit={handleAdd} className="mb-6">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="RSS 源 URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="名称（可选）"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-36 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={adding}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50 whitespace-nowrap"
            >
              {adding ? "添加中..." : "添加"}
            </button>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </form>
      )}

      {/* Feed list */}
      {user ? (
        <>
          {/* Preset feeds */}
          {filteredDefaults.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-2">
                预设源（{filteredDefaults.length}）
              </h2>
              <div className="grid gap-2">
                {filteredDefaults.map((feed) => (
                  <FeedRow
                    key={feed.id}
                    feed={feed}
                    onDelete={() => handleDelete(feed)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Custom feeds */}
          {filteredCustom.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 mb-2">
                自定义源（{filteredCustom.length}）
              </h2>
              <div className="grid gap-2">
                {filteredCustom.map((feed) => (
                  <FeedRow
                    key={feed.id}
                    feed={feed}
                    onDelete={() => handleDelete(feed)}
                  />
                ))}
              </div>
            </section>
          )}

          {filteredDefaults.length === 0 && filteredCustom.length === 0 && (
            <p className="text-center text-gray-400 py-8">
              {search ? "未找到匹配的源" : "暂无订阅源"}
            </p>
          )}
        </>
      ) : (
        <div className="grid gap-2">
          {filteredStatic.map((feed) => (
            <div
              key={feed.xml_url}
              className="flex items-center justify-between p-3 bg-white rounded border border-gray-200"
            >
              <span className="font-medium text-sm">{feed.title}</span>
              {feed.html_url && (
                <a
                  href={feed.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  访问 ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeedRow({
  feed,
  onDelete,
}: {
  feed: FeedItem;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
      <div className="min-w-0 mr-3">
        <span className="font-medium text-sm block truncate">
          {feed.feed_title || feed.feed_url}
        </span>
        {feed.feed_title && (
          <span className="text-xs text-gray-400 block truncate">
            {feed.feed_url}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        {feed.type === "default" && (
          <span className="text-xs text-gray-300">预设</span>
        )}
        <button
          onClick={onDelete}
          className="text-xs text-red-400 hover:text-red-600 whitespace-nowrap"
        >
          删除
        </button>
      </div>
    </div>
  );
}
