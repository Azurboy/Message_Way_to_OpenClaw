# 新启动 Daily → OpenClaw

AI 驱动的每日技术摘要，专为 agent 访问设计。

## 架构

```
GitHub Actions (每日定时)
  → Python Pipeline: 抓取 92 个 RSS 源 + AI 生成摘要
  → 生成静态内容 → git push → Vercel 自动部署

Vercel (Next.js)
  → 人类可读网页 + JSON API + llms.txt + OpenClaw Skill
```

## 本地开发

### Pipeline

```bash
export SILICONFLOW_API_KEY=sk-xxx
python -m pipeline.run
```

运行后检查 `site/content/digests/latest.json`。

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
| `/api/digest/latest` | 最新摘要 JSON |
| `/api/digest/YYYY-MM-DD` | 指定日期摘要 |
| `/api/feeds` | 监控的博客列表 |
| `/api/archive` | 历史摘要索引 |
| `/llms.txt` | AI agent 发现文件 |
| `/llms-full.txt` | 完整最新摘要 (Markdown) |
| `/SKILL.md` | OpenClaw skill 定义 |
