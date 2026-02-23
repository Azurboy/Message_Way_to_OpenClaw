import type { Metadata } from "next";
import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "DailyBit",
  description: "每日技术文章库 - 监控92个顶级技术博客，AI为每篇生成中文摘要和标签，人与Agent都能获取信息",
  other: {
    "ai-plugin": "/.well-known/ai-plugin.json",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="alternate" type="text/markdown" href="/SKILL.md" title="OpenClaw Skill Definition" />
      </head>
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <nav className="border-b border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600">
              DailyBit
            </Link>
            <div className="flex gap-6 text-sm items-center">
              <Link href="/home" className="text-gray-600 hover:text-gray-900">首页</Link>
              <Link href="/favorites" className="text-gray-600 hover:text-gray-900">收藏</Link>
              <Link href="/feeds" className="text-gray-600 hover:text-gray-900">源列表</Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900">关于</Link>
              <AuthButton />
            </div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 mt-16">
          <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
            DailyBit - AI 驱动的每日技术摘要 ·{" "}
            <Link href="/SKILL.md" className="underline">OpenClaw Skill</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
