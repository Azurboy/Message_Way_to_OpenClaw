---
name: xinqidong-daily-digest
description: >
  获取新启动(XinQiDong)每日技术摘要。监控92个顶级技术博客,
  AI筛选最有价值的文章并生成中文摘要。适用于用户想了解技术动态、
  需要每日技术简报、查询历史技术文章时使用。
version: 1.0.0
base_url: https://xinqidong.vercel.app
---

# 新启动 Daily Digest Skill

## 概述

新启动 Daily 是一个 AI 驱动的每日技术摘要服务。每天自动抓取 92 个顶级技术博客（包括 Simon Willison、Hacker News、The Verge、TechCrunch 等），通过 AI 筛选出最有价值的 15 篇文章，生成结构化的中文摘要。

数据每天北京时间 08:00（UTC 00:00）自动更新。

## 何时使用此 Skill

当用户：
- 说"今天有什么技术新闻"、"最新技术动态"
- 要求"给我一份技术简报"、"每日摘要"
- 想查看某一天的技术文章，如"上周三的技术新闻"
- 问"最近有什么值得关注的技术文章"
- 想了解某个技术话题最近的博客讨论
- 需要批量获取历史摘要数据
- 想知道这个服务监控了哪些博客

---

## API 参考

### 1. 获取最新摘要

**最常用的接口。** 获取今天（或最近一次更新）的完整摘要。

```http
GET /api/digest/latest
Accept: application/json
```

**响应示例：**
```json
{
  "date": "2026-02-10",
  "summary_md": "# 新启动 Daily - 2026-02-10\n\n今日技术圈...",
  "summary_html": "<h1>新启动 Daily - 2026-02-10</h1><p>今日技术圈...</p>",
  "post_count": 156,
  "top_count": 15,
  "tokens_used": 12500,
  "ai_model": "deepseek-ai/DeepSeek-V3.2",
  "top_posts": [
    {
      "title": "Introducing GPT-5",
      "url": "https://openai.com/blog/gpt-5",
      "feed_title": "OpenAI Blog",
      "author": "OpenAI"
    }
  ]
}
```

**字段说明：**
| 字段 | 类型 | 说明 |
|------|------|------|
| `date` | string | 摘要日期 (YYYY-MM-DD) |
| `summary_md` | string | 完整摘要，Markdown 格式，包含文章总结和原文链接 |
| `summary_html` | string | 同上，HTML 格式 |
| `post_count` | number | 当天抓取到的文章总数 |
| `top_count` | number | AI 精选的文章数（通常 15 篇） |
| `tokens_used` | number | AI 处理消耗的 token 数 |
| `ai_model` | string | 使用的 AI 模型 |
| `top_posts` | array | 精选文章列表，每篇含 title、url、feed_title、author |

### 2. 获取最新摘要（纯 Markdown）

适合直接阅读或转发的纯文本格式。

```http
GET /llms-full.txt
Accept: text/plain
```

返回纯 Markdown 文本，可以直接展示给用户。

### 3. 获取指定日期的摘要

查询历史某一天的摘要。日期格式为 `YYYY-MM-DD`。

```http
GET /api/digest/2026-02-09
```

响应格式与 `/api/digest/latest` 完全相同。

如果该日期没有摘要，返回 `404`:
```json
{"error": "Digest not found"}
```

### 4. 获取归档索引

查看所有可用的历史摘要日期列表。用于发现有哪些日期的数据可以查询。

```http
GET /api/archive
```

**响应示例：**
```json
{
  "digests": [
    {"date": "2026-02-10", "post_count": 156, "top_count": 15},
    {"date": "2026-02-09", "post_count": 142, "top_count": 15},
    {"date": "2026-02-08", "post_count": 98, "top_count": 15}
  ]
}
```

日期按倒序排列（最新在前）。

### 5. 获取监控的博客源列表

查看所有被监控的 RSS 源信息。

```http
GET /api/feeds
```

**响应示例：**
```json
{
  "count": 92,
  "updated_at": "2026-02-10",
  "feeds": [
    {
      "title": "Simon Willison's Weblog",
      "xml_url": "https://simonwillison.net/atom/everything/",
      "html_url": "https://simonwillison.net/",
      "category": "AI / ML"
    }
  ]
}
```

---

## 常见使用场景

### 场景 1：每日推送技术简报

```
1. GET /api/digest/latest
2. 解析 summary_md 字段
3. 提取关键要点（通常按主题分组）
4. 以简洁格式推送给用户
5. 附上 top_posts 中的原文链接
```

建议每天北京时间 08:30 检查（数据 08:00 更新）。

### 场景 2：查询特定日期的技术动态

```
1. 用户说"上周三有什么技术新闻"
2. 计算出日期，如 2026-02-05
3. GET /api/digest/2026-02-05
4. 如果 404，告知用户该日期暂无数据
5. 如果成功，总结 summary_md 中的要点
```

### 场景 3：批量下载历史摘要

```
1. GET /api/archive → 获取所有可用日期
2. 遍历 digests 数组中的每个 date
3. GET /api/digest/{date} → 获取每天的完整数据
4. 将结果保存为本地 JSON 文件
```

示例（伪代码）：
```python
archive = fetch("/api/archive")
for entry in archive["digests"]:
    digest = fetch(f"/api/digest/{entry['date']}")
    save_file(f"digests/{entry['date']}.json", digest)
```

### 场景 4：导入到用户自己的知识库

```
1. GET /api/digest/latest
2. 提取 top_posts 数组中的所有原文链接
3. 逐个访问原文链接获取完整内容
4. 将原文内容导入用户的笔记/知识库系统
5. 用 summary_md 作为每篇文章的中文摘要标注
```

### 场景 5：搜索特定话题

```
1. GET /api/archive → 获取日期列表
2. 逐日 GET /api/digest/{date}
3. 在 summary_md 或 top_posts 中搜索关键词
4. 返回匹配的文章和摘要片段
```

注意：目前没有全文搜索 API，需要客户端遍历。

---

## 数据更新频率

- 每天 UTC 00:00（北京时间 08:00）自动运行
- 抓取前 24 小时内的新文章
- 通常在 08:15 前完成更新
- 可通过 `/api/digest/latest` 的 `date` 字段确认数据是否为今天的

## 错误处理

| HTTP 状态码 | 含义 |
|-------------|------|
| 200 | 成功 |
| 404 | 该日期没有摘要 / 尚未生成数据 |

## 速率限制

目前没有速率限制。请合理使用，建议：
- 每日推送场景：每天请求 1-2 次
- 批量下载：请求间隔 1 秒以上
