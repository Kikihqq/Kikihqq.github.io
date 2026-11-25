# 一篇博客，一个文件夹

完整的新增、编辑、原稿预览及 GitHub 推送流程见 [博客维护流程](../WORKFLOW.md)。文章顶部可配置 `original-notes: assets/original-notes.pdf` 或 Markdown 文件，显示“初始笔记”按钮；不配置则隐藏。

新文章沿用 [博客排版与写作规范](../WORKFLOW.md#博客排版与写作规范)，其中包括标题层级、图表和公式、模型对比图及交互演示。

```text
blog/posts/
└── 2026-08-05-video-generation/
    ├── index.md       # 正文与 YAML 文章设置，日常编辑这个文件
    ├── index.html     # 构建生成，不要手动修改
    └── assets/        # 本篇文章的图片、附件等
```

新增文章：创建小写英文、数字和连字符组成的目录，将编辑器导出的 Markdown 重命名为 `index.md`。标题、日期、简介、分类、标签、gallery、document、preview 等设置都放在正文顶部的 YAML 中，不需要另建配置文件。

博客列表展示页提供英文 Categories 筛选：`Talk Notes`、`Paper Notes`、`Learning Reflections`。在文章 YAML 中设置，例如 `note-type: Paper Notes`；未填写时为 `Uncategorized`。它独立于研究主题 `topic` 和标题上方的装饰文字 `category`，可与主题、年份共同筛选。写作编辑器不提供此分类选项，编辑器导出后可在 Markdown 顶部添加归档设置。

图片引用用 `![说明](assets/example.png)`；顶部图集用 `gallery: [assets/example.png]`。PDF 与幻灯片也放在本篇 `assets/`，`document` 和 `preview` 使用相对于文章目录的路径。这样 Markdown 本地预览和生成网页使用同一套图片路径。编辑器导出的内嵌图片也仍然支持。

文章之间用 `../另一篇文章目录/index.html` 链接。公共模板、样式、图集脚本和交互组件保留在 `blog/`，由构建器统一引用，不为每篇文章复制。

在仓库根目录运行 `./blog/build-blog.sh`，生成文章页面、博客列表和首页卡片。新文章网址是 `blog/posts/文章目录/index.html`；旧的 `blog/文章目录.html` 自动跳转，并保留查询参数和章节锚点。文件夹名称应尽量保持稳定。

`legacy-metadata.yaml` 仅为历史资料保留，不参与构建；当前生效的设置以 `index.md` 为准。审校记录位于 `blog/review-notes-2026-08-05.md`，它跨两篇文章，所以不归入某一篇。

检查命令：`python3 -m unittest discover -s blog/tests`。不需要发布或推送即可通过本地 HTTP 服务预览。
