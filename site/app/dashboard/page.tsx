"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  display_name: string | null;
  tier: string;
  subscription_status: string | null;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [feedCount, setFeedCount] = useState(0);
  const [articleCount, setArticleCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (!data.user) {
        window.location.href = "/auth/login";
        return;
      }
      setUser(data.user);

      // Load profile and counts in parallel
      Promise.all([
        supabase
          .from("profiles")
          .select("display_name, tier, subscription_status")
          .eq("id", data.user.id)
          .single(),
        supabase
          .from("user_feeds")
          .select("id", { count: "exact", head: true })
          .eq("user_id", data.user.id),
        supabase
          .from("user_articles")
          .select("id", { count: "exact", head: true })
          .eq("user_id", data.user.id),
      ]).then(([profileRes, feedsRes, articlesRes]) => {
        if (cancelled) return;
        if (profileRes.data) setProfile(profileRes.data);
        setFeedCount(feedsRes.count ?? 0);
        setArticleCount(articlesRes.count ?? 0);
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

  const isPro = profile?.tier === "pro";

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      <h1 className="text-2xl font-bold mb-2">
        你好，{profile?.display_name || user?.email?.split("@")[0]}
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        当前方案：
        <span
          className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${
            isPro
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {isPro ? "Pro" : "Free"}
        </span>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <DashCard
          label="订阅源"
          value={feedCount}
          href="/feeds"
        />
        <DashCard
          label="我的文章"
          value={articleCount}
          href="/dashboard/articles"
        />
        <DashCard label="云端收藏" value="—" href="/favorites" />
        <DashCard
          label="设置"
          value="—"
          href="/dashboard/settings"
          locked={!isPro}
        />
      </div>

      {!isPro && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg">
          <p className="text-sm text-gray-700 mb-2">
            升级到 <strong>Pro</strong> 解锁自定义 AI prompt、笔记编辑、自定义 SKILL.md 等高级功能。
          </p>
          <Link
            href="/pricing"
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            查看定价 →
          </Link>
        </div>
      )}
    </div>
  );
}

function DashCard({
  label,
  value,
  href,
  locked,
}: {
  label: string;
  value: number | string;
  href: string;
  locked?: boolean;
}) {
  return (
    <Link
      href={locked ? "/pricing" : href}
      className="block p-5 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold mt-1">
        {locked ? (
          <span className="text-gray-300 text-base">Pro 专属</span>
        ) : (
          value
        )}
      </p>
    </Link>
  );
}
