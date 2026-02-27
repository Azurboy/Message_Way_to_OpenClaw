"use client";

import Link from "next/link";
import { useFavorites } from "@/lib/hooks";

interface Article {
  id: string;
  title: string;
  url: string;
  author: string;
  feed_title: string;
  summary_zh: string;
  tags: string[];
}

interface ArticleCardProps {
  article: Article;
  selectedTags?: string[];
  onTagClick?: (tag: string) => void;
  isCustom?: boolean;
  isRead?: boolean;
  onRead?: (id: string) => void;
  viewMode?: "card" | "list";
}

export function ArticleCard({
  article,
  selectedTags = [],
  onTagClick,
  isCustom,
  isRead,
  onRead,
  viewMode = "card",
}: ArticleCardProps) {
  const { isFavorite, addFavorite, removeFavorite, isLoaded } = useFavorites();
  const favorited = isFavorite(article.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleClick = () => {
    onRead?.(article.id);
  };

  if (viewMode === "list") {
    return (
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100 hover:border-blue-200 transition-colors ${
          isRead ? "opacity-50" : ""
        }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/article/${article.id}`}
              onClick={handleClick}
              className={`text-sm font-medium truncate hover:text-blue-600 ${
                isRead ? "text-gray-400" : "text-gray-900"
              }`}
            >
              {article.title}
            </Link>
            {isCustom && (
              <span className="flex-shrink-0 px-1.5 py-0.5 text-xs bg-green-50 text-green-600 rounded">
                自定义
              </span>
            )}
          </div>
        </div>
        <span className="flex-shrink-0 text-xs text-gray-400">{article.feed_title}</span>
        <div className="flex-shrink-0 flex gap-1">
          {article.tags.slice(0, 2).map((tag) => (
            <button
              key={tag}
              onClick={() => onTagClick?.(tag)}
              className={`px-1.5 py-0.5 text-xs rounded-full ${
                selectedTags.includes(tag)
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {tag.split("/").pop()}
            </button>
          ))}
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          {isLoaded && (
            <button onClick={handleFavorite} className={`text-xs ${favorited ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"}`}>
              {favorited ? "★" : "☆"}
            </button>
          )}
          <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-gray-600">
            ↗
          </a>
        </div>
      </div>
    );
  }

  // Card view (default)
  return (
    <article
      className={`p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors ${
        isRead ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href={`/article/${article.id}`}
            onClick={handleClick}
            className={`text-lg font-medium hover:text-blue-600 ${
              isRead ? "text-gray-400" : "text-gray-900"
            }`}
          >
            {article.title}
          </Link>
          <p className="text-sm text-gray-500 mt-1">
            {article.feed_title}
            {article.author && ` · ${article.author}`}
            {isCustom && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-50 text-green-600 rounded">
                自定义源
              </span>
            )}
          </p>
        </div>
        {isLoaded && (
          <button
            onClick={handleFavorite}
            className={`p-2 rounded-full transition-colors ${
              favorited
                ? "text-yellow-500 bg-yellow-50 hover:bg-yellow-100"
                : "text-gray-400 hover:text-yellow-500 hover:bg-gray-100"
            }`}
            title={favorited ? "取消收藏" : "收藏"}
          >
            <svg className="w-5 h-5" fill={favorited ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        )}
      </div>
      <p className="text-gray-700 mt-2 text-sm leading-relaxed">{article.summary_zh}</p>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {article.tags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => onTagClick?.(tag)}
              className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
        <Link href={`/article/${article.id}`} onClick={handleClick} className="text-xs text-blue-600 hover:underline">
          站内阅读 →
        </Link>
        <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-700">
          原文链接 ↗
        </a>
      </div>
    </article>
  );
}

// --- Hierarchical Tag Filter ---

interface TagFilterProps {
  tags: { name: string; count: number }[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClear: () => void;
}

interface TagNode {
  name: string;
  fullPath: string;
  count: number;
  children: TagNode[];
}

function buildTagTree(tags: { name: string; count: number }[]): TagNode[] {
  // Group by top-level
  const topMap = new Map<string, { count: number; children: Map<string, { count: number; children: { name: string; fullPath: string; count: number }[] }> }>();

  for (const { name, count } of tags) {
    const parts = name.split("/");
    const top = parts[0];

    if (!topMap.has(top)) {
      topMap.set(top, { count: 0, children: new Map() });
    }
    const topNode = topMap.get(top)!;

    if (parts.length === 1) {
      topNode.count += count;
    } else if (parts.length === 2) {
      const sub = parts[1];
      if (!topNode.children.has(sub)) {
        topNode.children.set(sub, { count: 0, children: [] });
      }
      topNode.children.get(sub)!.count += count;
    } else if (parts.length >= 3) {
      const sub = parts[1];
      if (!topNode.children.has(sub)) {
        topNode.children.set(sub, { count: 0, children: [] });
      }
      topNode.children.get(sub)!.children.push({
        name: parts.slice(2).join("/"),
        fullPath: name,
        count,
      });
    }
  }

  // Build tree
  const tree: TagNode[] = [];
  for (const [topName, topData] of topMap) {
    const children: TagNode[] = [];
    // Aggregate: top-level count = its own direct count + all children
    let totalCount = topData.count;

    for (const [subName, subData] of topData.children) {
      const subChildren: TagNode[] = subData.children.map((c) => ({
        ...c,
        children: [],
      }));
      const subTotal = subData.count + subChildren.reduce((s, c) => s + c.count, 0);
      totalCount += subTotal;
      children.push({
        name: subName,
        fullPath: `${topName}/${subName}`,
        count: subTotal,
        children: subChildren,
      });
    }

    tree.push({
      name: topName,
      fullPath: topName,
      count: totalCount,
      children: children.sort((a, b) => b.count - a.count),
    });
  }

  return tree.sort((a, b) => b.count - a.count);
}

export function TagFilter({ tags, selectedTags, onTagToggle, onClear }: TagFilterProps) {
  const [expandedTop, setExpandedTop] = useState<string | null>(null);
  const tree = useMemo(() => buildTagTree(tags), [tags]);

  const toggleExpand = (topName: string) => {
    setExpandedTop((prev) => (prev === topName ? null : topName));
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">标签筛选</h3>
        {selectedTags.length > 0 && (
          <button onClick={onClear} className="text-xs text-gray-500 hover:text-gray-700">
            清除筛选
          </button>
        )}
      </div>
      {/* Top-level tags */}
      <div className="flex flex-wrap gap-2">
        {tree.map((node) => {
          const isSelected = selectedTags.includes(node.fullPath);
          const isExpanded = expandedTop === node.name;
          const hasChildren = node.children.length > 0;
          return (
            <button
              key={node.fullPath}
              onClick={() => {
                if (hasChildren) {
                  toggleExpand(node.name);
                } else {
                  onTagToggle(node.fullPath);
                }
              }}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : isExpanded
                  ? "bg-blue-100 text-blue-700 ring-1 ring-blue-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {node.name}
              <span className={`ml-1 ${isSelected ? "text-blue-200" : "text-gray-400"}`}>
                {node.count}
              </span>
              {hasChildren && (
                <span className="ml-0.5 text-gray-400">{isExpanded ? " ▾" : " ▸"}</span>
              )}
            </button>
          );
        })}
      </div>
      {/* Expanded subtags */}
      {expandedTop && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-2">
            {/* Top-level tag itself as filter option */}
            {(() => {
              const topNode = tree.find((n) => n.name === expandedTop);
              if (!topNode) return null;
              const isSelected = selectedTags.includes(topNode.fullPath);
              return (
                <button
                  key={topNode.fullPath}
                  onClick={() => onTagToggle(topNode.fullPath)}
                  className={`px-2.5 py-0.5 text-xs rounded-full transition-colors ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  全部 {topNode.name}
                  <span className={`ml-1 ${isSelected ? "text-blue-200" : "text-blue-400"}`}>
                    {topNode.count}
                  </span>
                </button>
              );
            })()}
            {tree
              .find((n) => n.name === expandedTop)
              ?.children.map((sub) => {
                const isSubSelected = selectedTags.includes(sub.fullPath);
                return (
                  <span key={sub.fullPath} className="inline-flex flex-wrap gap-1">
                    <button
                      onClick={() => onTagToggle(sub.fullPath)}
                      className={`px-2.5 py-0.5 text-xs rounded-full transition-colors ${
                        isSubSelected
                          ? "bg-blue-600 text-white"
                          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      {sub.name}
                      <span className={`ml-1 ${isSubSelected ? "text-blue-200" : "text-blue-400"}`}>
                        {sub.count}
                      </span>
                    </button>
                    {sub.children.map((leaf) => {
                      const isLeafSelected = selectedTags.includes(leaf.fullPath);
                      return (
                        <button
                          key={leaf.fullPath}
                          onClick={() => onTagToggle(leaf.fullPath)}
                          className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                            isLeafSelected
                              ? "bg-blue-600 text-white"
                              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {leaf.name}
                          <span className={`ml-1 ${isLeafSelected ? "text-blue-200" : "text-gray-400"}`}>
                            {leaf.count}
                          </span>
                        </button>
                      );
                    })}
                  </span>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from "react";

interface DateSelectorProps {
  dates: { date: string; count: number }[];
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function DateSelector({ dates, selectedDate, onDateChange }: DateSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-gray-600">日期：</label>
      <select
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {dates.map(({ date, count }) => (
          <option key={date} value={date}>
            {date} ({count} 篇)
          </option>
        ))}
      </select>
    </div>
  );
}
