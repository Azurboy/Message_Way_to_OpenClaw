"""AI summarizer using SiliconFlow API (OpenAI compatible) - stateless."""

import json
import logging
import re
from datetime import date, datetime, timezone, timedelta

from openai import OpenAI

from pipeline.config import SILICONFLOW_API_KEY, SILICONFLOW_MODEL, AI_SNIPPET_LENGTH, AI_TOP_N

logger = logging.getLogger(__name__)

# Max posts to send to AI ranking (to stay within token limits)
MAX_POSTS_FOR_RANKING = 200


def _get_client() -> OpenAI:
    if not SILICONFLOW_API_KEY:
        raise RuntimeError("SILICONFLOW_API_KEY not configured")
    return OpenAI(
        api_key=SILICONFLOW_API_KEY,
        base_url="https://api.siliconflow.cn/v1",
    )


def generate_digest(posts: list[dict]) -> dict:
    """Generate a daily digest from posts.

    Args:
        posts: List of post dicts from feed_fetcher.

    Returns:
        Dict with keys: date, summary_md, summary_html, post_count,
        top_count, tokens_used, ai_model.
    """
    if not posts:
        return {
            "date": date.today().isoformat(),
            "summary_md": "今日暂无新文章。",
            "summary_html": "<p>今日暂无新文章。</p>",
            "post_count": 0,
            "top_count": 0,
            "tokens_used": 0,
            "ai_model": SILICONFLOW_MODEL,
        }

    client = _get_client()
    today = date.today().isoformat()

    # Filter to recent posts (last 48h) and limit count for ranking
    recent = _filter_recent_posts(posts, hours=48)
    if not recent:
        recent = posts  # fallback: use all if none have timestamps
    candidates = sorted(recent, key=lambda p: p.get("published_at", ""), reverse=True)[:MAX_POSTS_FOR_RANKING]
    logger.info(f"Ranking {len(candidates)} candidates (from {len(posts)} total, {len(recent)} recent)")

    # Stage 1: Rank posts
    ranked = _rank_posts(client, candidates)

    # Stage 2: Generate summary from top posts
    top_posts = ranked[:AI_TOP_N]
    summary_md, tokens_used = _generate_summary(client, top_posts, today)
    summary_html = _md_to_html(summary_md)

    return {
        "date": today,
        "summary_md": summary_md,
        "summary_html": summary_html,
        "post_count": len(posts),
        "top_count": len(top_posts),
        "tokens_used": tokens_used,
        "ai_model": SILICONFLOW_MODEL,
        "top_posts": [
            {"title": p["title"], "url": p["url"], "feed_title": p.get("feed_title", ""), "author": p.get("author", "")}
            for p in top_posts
        ],
    }


def _filter_recent_posts(posts: list[dict], hours: int = 48) -> list[dict]:
    """Filter posts to only those published within the last N hours."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    cutoff_iso = cutoff.isoformat()
    recent = []
    for p in posts:
        pub = p.get("published_at", "")
        if pub and pub >= cutoff_iso:
            recent.append(p)
    return recent


def _rank_posts(client: OpenAI, posts: list[dict]) -> list[dict]:
    """Use AI to rank posts by newsworthiness."""
    post_list = ""
    # Use shorter snippets for ranking to stay within token limits
    rank_snippet_len = min(AI_SNIPPET_LENGTH, 150)
    for i, p in enumerate(posts):
        snippet = (p.get("content") or "")[:rank_snippet_len]
        feed_title = p.get("feed_title", "")
        post_list += f"\n{i+1}. [{feed_title}] \"{p['title']}\" ({p.get('published_at', 'unknown')})\n   {snippet}\n"

    prompt = f"""你是一位技术新闻编辑。以下是过去24小时内来自各技术博客的 {len(posts)} 篇文章。
请按新闻价值（1-10分）对每篇文章打分，并选出最值得关注的 top {AI_TOP_N} 篇。

评分标准：原创性、对技术行业的影响、实用价值、是否揭示新信息。

文章列表：
{post_list}

请以JSON格式回复：
{{"rankings": [{{"index": 1, "score": 8, "reason": "简短理由"}}], "top_picks": [1, 5, 12]}}

只返回JSON，不要其他内容。"""

    try:
        response = client.chat.completions.create(
            model=SILICONFLOW_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=4000,
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        result = json.loads(content)
        top_indices = [i - 1 for i in result.get("top_picks", [])]
        return [posts[i] for i in top_indices if 0 <= i < len(posts)]
    except Exception as e:
        logger.warning(f"AI ranking failed, using recency fallback: {e}")
        return sorted(posts, key=lambda p: p.get("published_at", ""), reverse=True)[:AI_TOP_N]


def _generate_summary(client: OpenAI, top_posts: list[dict], today: str) -> tuple[str, int]:
    """Generate a Chinese digest summary."""
    articles = ""
    for i, p in enumerate(top_posts):
        content = (p.get("content") or "")[:2000]
        articles += f"\n### {i+1}. [{p.get('feed_title', '')}] {p['title']}\n"
        articles += f"链接: {p['url']}\n"
        articles += f"作者: {p.get('author', '未知')}\n"
        articles += f"{content}\n"

    prompt = f"""你正在撰写一份名为「新启动 Daily」的每日技术摘要，日期为 {today}。
以下是今日最值得关注的 {len(top_posts)} 篇技术文章。

请撰写一份中文摘要：
- 开头用2-3句话概述今日主题
- 按主题分组，每篇文章用2-4句话总结要点
- 每篇附上原文链接
- 结尾可以有一个"快讯"部分，简要提及其他值得注意的内容
- 语气：专业、简洁、像一位知识渊博的朋友在分享
- 使用 Markdown 格式

文章内容：
{articles}"""

    response = client.chat.completions.create(
        model=SILICONFLOW_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=8000,
    )

    summary = response.choices[0].message.content.strip()
    tokens = response.usage.total_tokens if response.usage else 0
    return summary, tokens


def _md_to_html(md: str) -> str:
    """Simple markdown to HTML conversion."""
    html = md
    html = re.sub(r'^### (.+)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.+)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^# (.+)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', html)
    html = re.sub(r'\n\n', '</p><p>', html)
    html = f'<p>{html}</p>'
    html = re.sub(r'^- (.+)$', r'<li>\1</li>', html, flags=re.MULTILINE)
    return html