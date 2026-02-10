import { readFileSync, existsSync } from "fs";
import { join } from "path";

const CONTENT_DIR = join(process.cwd(), "content");
const DIGESTS_DIR = join(CONTENT_DIR, "digests");

export interface Digest {
  date: string;
  summary_md: string;
  summary_html: string;
  post_count: number;
  top_count: number;
  tokens_used: number;
  ai_model: string;
  top_posts?: { title: string; url: string; feed_title: string; author: string }[];
}

export interface FeedsData {
  count: number;
  updated_at: string;
  feeds: { title: string; xml_url: string; html_url: string; category: string }[];
}

export interface ArchiveEntry {
  date: string;
  post_count: number;
  top_count: number;
}

export interface ArchiveIndex {
  digests: ArchiveEntry[];
}

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

export function getLatestDigest(): Digest | null {
  return readJson<Digest>(join(DIGESTS_DIR, "latest.json"));
}

export function getDigestByDate(date: string): Digest | null {
  // Sanitize date input to prevent path traversal
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return readJson<Digest>(join(DIGESTS_DIR, `${date}.json`));
}

export function getDigestMarkdown(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const path = join(DIGESTS_DIR, `${date}.md`);
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

export function getArchiveIndex(): ArchiveIndex {
  return readJson<ArchiveIndex>(join(CONTENT_DIR, "index.json")) ?? { digests: [] };
}

export function getFeedsData(): FeedsData | null {
  return readJson<FeedsData>(join(CONTENT_DIR, "feeds.json"));
}
