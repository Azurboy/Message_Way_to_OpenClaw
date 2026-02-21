"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AnalyticsData {
  counts: { today: number; week: number; month: number };
  by_agent: { agent_name: string; count: number }[];
  by_endpoint: { endpoint: string; count: number }[];
  recent: {
    id: number;
    endpoint: string;
    method: string;
    agent_name: string | null;
    status_code: number;
    created_at: string;
  }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/user/analytics")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-20 text-center text-gray-500">
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-20 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">API 调用统计</h1>
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 返回仪表盘
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "今日", value: data.counts.today },
          { label: "本周", value: data.counts.week },
          { label: "本月", value: data.counts.month },
        ].map((item) => (
          <div
            key={item.label}
            className="p-4 border border-gray-200 rounded-lg text-center"
          >
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="text-xs text-gray-400 mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {/* By agent and endpoint */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            按 Agent（本周）
          </h2>
          {data.by_agent.length === 0 ? (
            <p className="text-xs text-gray-400">暂无数据</p>
          ) : (
            <div className="space-y-2">
              {data.by_agent.map((row) => (
                <div
                  key={row.agent_name}
                  className="flex justify-between text-sm"
                >
                  <span>{row.agent_name || "Unknown"}</span>
                  <span className="font-mono text-gray-500">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            按端点（本周）
          </h2>
          {data.by_endpoint.length === 0 ? (
            <p className="text-xs text-gray-400">暂无数据</p>
          ) : (
            <div className="space-y-2">
              {data.by_endpoint.map((row) => (
                <div
                  key={row.endpoint}
                  className="flex justify-between text-sm"
                >
                  <span className="font-mono text-xs">{row.endpoint}</span>
                  <span className="font-mono text-gray-500">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent logs */}
      <h2 className="text-sm font-semibold text-gray-700 mb-3">
        最近 50 条调用
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-left text-gray-400">
              <th className="py-2 pr-3">时间</th>
              <th className="py-2 pr-3">方法</th>
              <th className="py-2 pr-3">端点</th>
              <th className="py-2 pr-3">Agent</th>
              <th className="py-2 pr-3">状态</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map((log) => (
              <tr key={log.id} className="border-b border-gray-100">
                <td className="py-1.5 pr-3 text-gray-400 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString("zh-CN", {
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="py-1.5 pr-3 font-mono">{log.method}</td>
                <td className="py-1.5 pr-3 font-mono">{log.endpoint}</td>
                <td className="py-1.5 pr-3">{log.agent_name || "-"}</td>
                <td className="py-1.5 pr-3">
                  <span
                    className={
                      log.status_code < 400
                        ? "text-green-600"
                        : "text-red-500"
                    }
                  >
                    {log.status_code}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
