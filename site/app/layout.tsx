import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "新启动 Daily",
  description: "每日技术摘要 - 监控92个顶级技术博客，AI筛选最有价值的文章",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <nav className="border-b border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600">
              新启动 Daily
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/archive" className="text-gray-600 hover:text-gray-900">归档</Link>
              <Link href="/feeds" className="text-gray-600 hover:text-gray-900">源列表</Link>
              <Link href="/about" className="text-gray-600 hover:text-gray-900">关于</Link>
            </div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 mt-16">
          <div className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
            新启动 Daily - AI 驱动的每日技术摘要 ·{" "}
            <Link href="/llms.txt" className="underline">llms.txt</Link> ·{" "}
            <Link href="/SKILL.md" className="underline">OpenClaw Skill</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
