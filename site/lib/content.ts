import { readFileSync, existsSync } from "fs";
import { join } from "path";

const CONTENT_DIR = join(process.cwd(), "content");
const ARTICLES_DIR = join(CONTENT_DIR, "articles");
const ARTICLE_CONTENT_DIR = join(CONTENT_DIR, "article-content");

export interface Article {
  id: string;
  title: string;
  url: string;
  author: string;
  feed_title: string;
  category: string;
  published_at: string;
  summary_zh: string;
  tags: string[];
  // Note: content field is no longer included in list responses
}

export interface ArticleContent {
  id: string;
  title: string;
  url: string;
  content: string;
}

export interface ArticlesData {
  date: string;
  article_count: number;
  tokens_used: number;
  ai_model: string;
  articles: Article[];
}

export interface ArchiveEntry {
  date: string;
  article_count: number;
}

export interface ArchiveIndex {
  entries: ArchiveEntry[];
}

export interface FeedsData {
  count: number;
  updated_at: string;
  feeds: { title: string; xml_url: string; html_url: string; category: string }[];
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

export function getLatestArticles(): ArticlesData | null {
  return readJson<ArticlesData>(join(ARTICLES_DIR, "latest.json"));
}

export function getArticlesByDate(date: string): ArticlesData | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return readJson<ArticlesData>(join(ARTICLES_DIR, `${date}.json`));
}

export function getArticlesByTags(data: ArticlesData, tags: string[]): Article[] {
  const tagSet = new Set(tags.map((t) => t.toLowerCase()));
  return data.articles.filter((a) =>
    a.tags.some((t) => tagSet.has(t.toLowerCase()))
  );
}

export function getArchiveIndex(): ArchiveIndex {
  const raw = readJson<Record<string, unknown>>(join(CONTENT_DIR, "index.json"));
  if (!raw) return { entries: [] };
  // Support both old "digests" and new "entries" key
  const entries = (raw.entries ?? raw.digests ?? []) as ArchiveEntry[];
  return { entries };
}

export function getFeedsData(): FeedsData | null {
  return readJson<FeedsData>(join(CONTENT_DIR, "feeds.json"));
}

export function getArticleContent(id: string): ArticleContent | null {
  if (!/^[a-f0-9]+$/i.test(id)) return null;
  return readJson<ArticleContent>(join(ARTICLE_CONTENT_DIR, `${id}.json`));
}
