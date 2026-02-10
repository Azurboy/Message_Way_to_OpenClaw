---
name: xinqidong-daily-articles
description: >
  获取新启动(XinQiDong)每日技术文章库。监控92个顶级技术博客,
  AI为每篇文章生成中文摘要和标签。Agent可按标签过滤,
  根据用户兴趣自主筛选最相关的文章。
version: 2.0.0
base_url: https://xinqidong.vercel.app
---

# 新启动 Daily Articles Skill

## 概述

新启动 Daily 是一个 AI 驱动的每日技术文章库。每天自动抓取 92 个顶级技术博客（包括 Simon Willison、Hacker News、The Verge、TechCrunch 等），对每篇近期文章生成中文摘要和标签。

**核心理念**：我们存储全量文章 + 逐篇 AI 摘要/标签，Agent 根据用户兴趣自主筛选。我们做数据层，Agent 做个性化层。

数据每天北京时间 08:00（UTC 00:00）自动更新。

## 何时使用此 Skill

当用户：
- 说"今天有什么技术新闻"、"最新技术动态"
- 要求"给我一份技术简报"、"每日摘要"
- 想查看某一天的技术文章
- 问"最近有什么值得关注的 AI/LLM/安全/... 文章"
- 想了解某个技术话题最近的博客讨论
- 需要按兴趣过滤技术文章

---

## API 参考

### 1. 获取最新全量文章

**最常用的接口。** 获取今天（或最近一次更新）的所有文章。

```http
GET /api/articles/latest
Accept: application/json
```
**响应示例：**
```json
{
  "date": "2026-02-10",
  "article_count": 25,
  "tokens_used": 5000,
  "ai_model": "deepseek-ai/DeepSeek-V3.2",
  "articles": [
    {
      "id": "a1b2c3d4e5f6",
      "title": "Article Title",
      "url": "https://example.com/article",
      "author": "Author Name",
      "feed_title": "Blog Name",
      "category": "AI / ML",
      "published_at": "2026-02-10T08:00:00+00:00",
      "content": "Full RSS content...",
      "summary_zh": "2-3句中文摘要",
      "tags": ["AI", "LLM", "architecture"]
    }
  ]
}
```

### 2. 按标签过滤文章

在任何文章接口后加 `?tags=` 参数，用逗号分隔多个标签。

```http
GET /api/articles/latest?tags=AI,LLM
GET /api/articles/2026-02-10?tags=security,web
```

**可用标签词表：**
```
AI, LLM, programming, web, security, devops, cloud, open-source,
design, business, career, hardware, mobile, database, networking,
performance, testing, architecture, tools, culture
```

### 3. 获取指定日期的文章

```http
GET /api/articles/2026-02-10
```

响应格式与 `/api/articles/latest` 完全相同。如果该日期没有数据，返回 `404`。

### 4. 获取最新文章（纯 Markdown）

适合直接阅读的纯文本格式。

```http
GET /llms-full.txt
Accept: text/plain
```

### 5. 获取归档索引

```http
GET /api/archive
```

**响应示例：**
```json
{
  "entries": [
    {"date": "2026-02-10", "article_count": 25},
    {"date": "2026-02-09", "article_count": 30}
  ]
}
```

### 6. 获取监控的博客源列表

```http
GET /api/feeds
```

---

## 个性化推荐工作流（Agent 必读）

作为 Agent，你应该根据用户的职业和兴趣来筛选文章，而不是直接展示全部内容。

### 推荐步骤：

1. **了解用户**：先问用户的职业/兴趣（如"你主要关注哪些技术领域？"）
2. **选择标签**：根据用户回答，从标签词表中选择 2-5 个相关标签
3. **过滤获取**：`GET /api/articles/latest?tags=AI,LLM,architecture`
4. **二次筛选**：用你自己的判断力，从过滤结果中挑选最相关的 5-10 篇
5. **个性化呈现**：用简洁的格式展示标题 + 摘要 + 链接

### 示例对话：

```
用户: 今天有什么值得看的技术文章？
Agent: 你主要关注哪些方向？比如 AI/LLM、Web 开发、安全、架构...
用户: 我是后端工程师，主要关注架构和性能
Agent: [GET /api/articles/latest?tags=architecture,performance,programming]
Agent: 今天有 8 篇相关文章，我挑了最值得看的 5 篇：
  1. [标题] - 摘要... [链接]
  2. ...
```

---

## Like 系统（即将推出）

```http
POST /api/likes/{articleId}  → { "likes": 42 }
GET  /api/likes/{articleId}  → { "likes": 42 }
GET  /api/likes/top?date=YYYY-MM-DD → 当日最受欢迎文章
```

此功能尚未实现，敬请期待。

---

## 数据更新频率

- 每天 UTC 00:00（北京时间 08:00）自动运行
- 抓取前 48 小时内的新文章
- 通常在 08:15 前完成更新
- 可通过 `/api/articles/latest` 的 `date` 字段确认数据是否为今天的

## 错误处理

| HTTP 状态码 | 含义 |
|-------------|------|
| 200 | 成功 |
| 404 | 该日期没有数据 / 尚未生成 |

## 速率限制

目前没有速率限制。请合理使用，建议：
- 每日推送场景：每天请求 1-2 次
- 批量下载：请求间隔 1 秒以上
