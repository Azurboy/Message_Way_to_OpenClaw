# CLAUDE.md

代码需要具备鲁棒性，如果出现bug，请提醒我后不断修改并测试用例。

遇到需要 human in the loop 的部分请及时提醒我，例如需要某些 API、Github 上传失败等问题。

## 项目结构

- `pipeline/` - Python 流水线：抓取 RSS → AI 摘要 → 生成静态内容
- `site/` - Next.js 网站：展示摘要 + JSON API + agent 接口
- `feeds.opml` - RSS 源列表
- `.github/workflows/` - GitHub Actions 每日定时任务
