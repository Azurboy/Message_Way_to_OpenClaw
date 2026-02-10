# 新启动 Daily → OpenClaw

AI 驱动的每日技术文章库，全量存储 + 逐篇摘要/标签，专为 Agent 自主筛选设计。

## 架构

```
GitHub Actions (每日定时)
  → Python Pipeline: 抓取 92 个 RSS 源 → 过滤近 48h → AI 批量摘要/标签
  → 生成 articles/{date}.json → git push → Vercel 自动部署

Vercel (Next.js)
  → 文章卡片列表 + JSON API（支持 ?tags= 过滤）+ llms.txt + OpenClaw Skill
  → Agent 获取全量文章 → 按标签过滤 → 根据用户兴趣自主挑选
```

## 本地开发

### Pipeline

```bash
export SILICONFLOW_API_KEY=sk-xxx
python -m pipeline.run
```

运行后检查 `site/content/articles/latest.json`。

### 网站

```bash
cd site
npm install
npm run dev
```

访问 `http://localhost:3000`。

## 部署

1. 推送到 GitHub
2. 在 repo Settings → Secrets 添加 `SILICONFLOW_API_KEY`
3. 在 Vercel 导入 repo，root directory 设为 `site/`
4. 手动触发 GitHub Action 验证

## Agent 接口

| 端点 | 说明 |
|------|------|
| `/api/articles/latest` | 全量文章 JSON |
| `/api/articles/latest?tags=AI,LLM` | 按标签过滤 |
| `/api/articles/YYYY-MM-DD` | 指定日期文章 |
| `/api/feeds` | 监控的博客列表 |
| `/api/archive` | 历史索引 |
| `/llms.txt` | AI agent 发现文件 |
| `/llms-full.txt` | 完整最新文章 (Markdown) |
| `/SKILL.md` | OpenClaw skill 定义 |

## 可用标签

```
AI, LLM, programming, web, security, devops, cloud, open-source,
design, business, career, hardware, mobile, database, networking,
performance, testing, architecture, tools, culture
```
