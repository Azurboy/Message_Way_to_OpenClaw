"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PricingPage() {
  const [tier, setTier] = useState<string>("free");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (data.user) {
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
      }
    }).catch(() => {});

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-16 px-4">
      <h1 className="text-3xl font-bold text-center mb-3">定价</h1>
      <p className="text-center text-gray-500 mb-12">
        公共内容永远免费。Pro 解锁个性化功能。
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free tier */}
        <div className="border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-1">Free</h2>
          <p className="text-3xl font-bold mb-4">
            ¥0<span className="text-sm font-normal text-gray-400">/月</span>
          </p>
          <ul className="space-y-2 text-sm text-gray-600 mb-6">
            <Feature text="每日技术摘要" />
            <Feature text="全部 92+ 源文章" />
            <Feature text="标签过滤" />
            <Feature text="云端收藏同步" />
            <Feature text="自定义 RSS 源（最多 50 个）" />
            <Feature text="AI Agent 接口" />
          </ul>
          {tier === "free" && (
            <div className="px-4 py-2 text-center text-sm text-gray-400 border border-gray-200 rounded-lg">
              当前方案
            </div>
          )}
        </div>

        {/* Pro tier */}
        <div className="border-2 border-blue-500 rounded-xl p-6 relative">
          <div className="absolute -top-3 left-4 bg-blue-500 text-white text-xs px-3 py-0.5 rounded-full">
            即将推出
          </div>
          <h2 className="text-lg font-semibold mb-1">Pro</h2>
          <p className="text-3xl font-bold mb-4">
            <span className="text-lg font-normal text-gray-400">敬请期待</span>
          </p>
          <ul className="space-y-2 text-sm text-gray-600 mb-6">
            <Feature text="Free 全部功能" />
            <Feature text="自定义 AI 摘要 Prompt" highlight />
            <Feature text="文章笔记 & 编辑" highlight />
            <Feature text="自定义 SKILL.md" highlight />
            <Feature text="优先技术支持" highlight />
          </ul>
          {tier === "pro" ? (
            <div className="px-4 py-2 text-center text-sm text-green-600 border border-green-200 bg-green-50 rounded-lg">
              已订阅
            </div>
          ) : (
            <div className="px-4 py-2.5 text-center text-sm text-gray-400 border border-gray-200 rounded-lg">
              即将上线
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Feature({ text, highlight }: { text: string; highlight?: boolean }) {
  return (
    <li className="flex items-start gap-2">
      <svg
        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${highlight ? "text-blue-500" : "text-gray-400"}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className={highlight ? "text-gray-800" : ""}>{text}</span>
    </li>
  );
}
