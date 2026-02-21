"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function TokenSection() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch("/api/user/token");
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  const generateToken = async () => {
    setActing(true);
    try {
      const res = await fetch("/api/user/token", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setRevealed(true);
      }
    } finally {
      setActing(false);
    }
  };

  const revokeToken = async () => {
    setActing(true);
    try {
      const res = await fetch("/api/user/token", { method: "DELETE" });
      if (res.ok) {
        setToken(null);
        setRevealed(false);
      }
    } finally {
      setActing(false);
    }
  };

  const copyToken = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-400">加载中...</div>;
  }

  return (
    <section className="mb-8 p-4 border border-gray-200 rounded-lg">
      <h2 className="text-sm font-semibold text-gray-700 mb-2">API Token</h2>
      <p className="text-xs text-gray-400 mb-3">
        把此 Token 分享给你的 AI Agent，Agent 即可帮你管理订阅源。
      </p>

      {token ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs font-mono break-all">
              {revealed ? token : "••••••••-••••-••••-••••-••••••••••••"}
            </code>
            <button
              onClick={() => setRevealed(!revealed)}
              className="px-3 py-2 text-xs border border-gray-200 rounded hover:bg-gray-50"
            >
              {revealed ? "隐藏" : "显示"}
            </button>
            <button
              onClick={copyToken}
              className="px-3 py-2 text-xs border border-gray-200 rounded hover:bg-gray-50"
            >
              {copied ? "已复制" : "复制"}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={generateToken}
              disabled={acting}
              className="px-3 py-1.5 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              {acting ? "处理中..." : "重新生成"}
            </button>
            <button
              onClick={revokeToken}
              disabled={acting}
              className="px-3 py-1.5 text-xs text-red-600 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50"
            >
              {acting ? "处理中..." : "撤销"}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={generateToken}
          disabled={acting}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
        >
          {acting ? "生成中..." : "生成 Token"}
        </button>
      )}
    </section>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tier, setTier] = useState("free");
  const [aiPrompt, setAiPrompt] = useState("");
  const [skillMd, setSkillMd] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (!data.user) {
        window.location.href = "/auth/login";
        return;
      }
      Promise.resolve(
        supabase
          .from("profiles")
          .select("tier, custom_ai_prompt, custom_skill_md")
          .eq("id", data.user.id)
          .single()
      ).then(({ data: profile }) => {
          if (cancelled) return;
          if (profile) {
            setTier(profile.tier);
            setAiPrompt(profile.custom_ai_prompt || "");
            setSkillMd(profile.custom_skill_md || "");
          }
          setLoading(false);
        }).catch(() => {});
    }).catch(() => {});

    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        custom_ai_prompt: aiPrompt || null,
        custom_skill_md: skillMd || null,
      })
      .eq("id", user.id);

    if (error) {
      setMessage("保存失败: " + error.message);
    } else {
      setMessage("已保存");
    }
    setSaving(false);
  };

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
        <h1 className="text-xl font-bold">设置</h1>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 返回仪表盘
        </Link>
      </div>

      {/* Token section — available to all users */}
      <TokenSection />

      {/* Pro-only sections */}
      {tier !== "pro" ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">自定义 AI Prompt 和 SKILL.md 需要 Pro 订阅。</p>
          <Link
            href="/pricing"
            className="text-blue-600 hover:underline font-medium"
          >
            查看定价 →
          </Link>
        </div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">
              自定义 AI 摘要 Prompt
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              pipeline 在为你的自定义源生成摘要时，会将此 prompt
              作为额外指令传给 AI。留空则使用默认 prompt。
            </p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={4}
              placeholder="例如：请用更简洁的语言总结，重点关注实际应用场景..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </section>

          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">
              自定义 SKILL.md
            </h2>
            <p className="text-xs text-gray-400 mb-3">
              当 AI Agent 访问你的专属路径时，会获取此 SKILL.md 作为行为规范。留空则使用全局 SKILL.md。
            </p>
            <textarea
              value={skillMd}
              onChange={(e) => setSkillMd(e.target.value)}
              rows={8}
              placeholder="# My SKILL.md&#10;&#10;自定义 Agent 行为规范..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </section>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50"
            >
              {saving ? "保存中..." : "保存设置"}
            </button>
            {message && (
              <span className="text-sm text-gray-500">{message}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
