"use client";

import Link from "next/link";
import { useFavorites, FavoriteArticle } from "@/lib/hooks";

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
}

export function ArticleCard({ article, selectedTags = [], onTagClick, isCustom }: ArticleCardProps) {
  const { isFavorite, addFavorite, removeFavorite, isLoaded } = useFavorites();
  const favorited = isFavorite(article.id);

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

  return (
    <article className="p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href={`/article/${article.id}`}
            className="text-lg font-medium text-gray-900 hover:text-blue-600"
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
            <svg
              className="w-5 h-5"
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
        <Link
          href={`/article/${article.id}`}
          className="text-xs text-blue-600 hover:underline"
        >
          站内阅读 →
        </Link>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          原文链接 ↗
        </a>
      </div>
    </article>
  );
}

interface TagFilterProps {
  tags: { name: string; count: number }[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClear: () => void;
}

export function TagFilter({ tags, selectedTags, onTagToggle, onClear }: TagFilterProps) {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">标签筛选</h3>
        {selectedTags.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            清除筛选
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map(({ name, count }) => {
          const isSelected = selectedTags.includes(name);
          return (
            <button
              key={name}
              onClick={() => onTagToggle(name)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {name}
              <span className={`ml-1 ${isSelected ? "text-blue-200" : "text-gray-400"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
