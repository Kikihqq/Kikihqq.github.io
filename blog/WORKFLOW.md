# 博客维护与发布流程

## 1. 一篇文章一个文件夹

```text
blog/posts/2026-11-10-my-note/
├── index.md                 # 正文及设置，编辑此文件
├── index.html               # 自动生成，勿直接修改
└── assets/
    ├── figure.png           # 正文配图
    ├── original-notes.pdf   # 初始笔记，PDF 或 Markdown 二选一
    └── notes-images/        # Markdown 原稿的配图（如有）
```

文章目录名使用小写英文、数字、连字符。复制已有文章目录作为起点时，先删除不属于新文章的配置与附件，避免误发布旧内容。

## 2. 编辑正文和设置

在 `index.md` 顶部写 YAML：

```yaml
---
title: 我的文章标题
date: 2026-11-10
description: 一句话简介
category: RESEARCH NOTES
topic: 3DV
note-type: Paper Notes
tags: [3D Vision, Reading]
format: markdown
original-notes: assets/original-notes.pdf
---
```

随后写 Markdown 正文，图片使用 `![说明](assets/figure.png)`。`note-type` 可选 `Talk Notes`、`Paper Notes`、`Learning Reflections`，主题 `topic` 与归档类别独立。

可以用本地 Markdown 编辑器直接编辑；网页编辑器 `blog/editor.html` 的导出文件需要保存为本篇 `index.md`。网页编辑器不会直接保存到仓库，导出后请检查并补回 `original-notes`、`note-type`、`gallery` 等额外设置。

### 博客排版与写作规范

- **标题与日期。** 每篇正文用 Markdown 二级标题分章、三级标题分模型或主题。文章日期以 `index.md` 的 `date` 为准，由构建器同步到首页、归档和文章页。综述开头可放横向时间轴，模型名链接到对应小节。时间轴和正文使用一致的机构、模型版本和发布日期。首发与论文日期不同则标明日期类型。机构与日期放在模型标题下，用小号次级文字，例如 `[机构名称 · 2026.09]{.model-meta}`。
- **先比较，再展开。** 多模型章节先用总览图并排比较各条路线，标出输入、输出或设计变化，再逐个讲模型。可确认的继承关系用箭头标示，解决同类问题的不同路线用并列布局。模型小节可依次写架构图、一个关键问题和答案、训练与评测。把问题放到能回答它的模型旁。
- **架构图与流程图。** 使用论文原图时标明来源、图号和裁切情况。重绘架构图时标出实际模块、输入输出、分支、汇合、条件注入与反馈。只有表示有先后顺序的操作时才画成步骤，并注明阶段，例如「训练」「推理」或「① ② ③」。闭源模型按官方资料的披露范围描述。
- **资料与评测。** 从论文、技术报告和官方仓库取具体信息，给训练数据、指标和实验配置附出处。成绩写清模型版本、数据划分和测试条件。技术综述优先选里程碑和有代表性的强模型，并说明新设计解决了什么问题。
- **图、图注与公式。** 在正文栏内居中，按图中文字的可读性设置尺寸。移动端允许宽架构图或长公式在各自容器内横向滚动。普通配图使用 Markdown 图片语法，独立公式使用 `$$…$$`。长公式可用 `::: {.article-equation}` 围出滚动区。行内公式继续随段落排版。
- **交互图。** 卡片在正文中居中，尺寸以读清图例、按钮和结果为准。有限的离散状态用按钮切换。适合逐步展示的示意图可以在进入视野时自动播放一轮，遵循设备的减少动态效果设置。暂停停在当前画面，继续从该步往下走，播完可重播，并显示播放状态与当前步数。已在其他文章详细演示的概念用文章链接串起来。
- **初始笔记。** Markdown 原稿预览保留返回正文和下载入口，直接显示原稿内容。侧栏按原稿 Markdown 标题层级缩进并链接到对应章节。

可参考 [Transformer 学习笔记](posts/2026-09-12-transformer/index.md) 的时间轴、模型介绍和交互图。正文的公共样式在 [article.css](article.css)。

## 3. 配置“初始笔记”按钮

- PDF：放进文章目录，并设置 `original-notes: assets/original-notes.pdf`。按钮在新标签页打开 PDF，由浏览器预览。
- Markdown：设置 `original-notes: assets/original-notes.md`。构建时会在原稿旁生成 `original-notes.preview.html`，按钮打开排版后的阅读页，而不是源码；另有下载原始 Markdown 的入口。
- Markdown 原稿的图片路径相对于原稿文件，例如 `![图](notes-images/figure.png)`，图片必须一起放入仓库。公式支持 `$...$` 和 `$$...$$`。
- 不需要原稿时删除 `original-notes` 这一行，按钮即不显示。仅放文件但不配置不会自动公开入口；但仓库中的文件仍可能被直接访问，因此不要提交私人材料。
- 文件路径错误、越出文章目录或格式不支持时，构建会报错。原稿不要指向正文 `index.md`。

## 4. 构建与检查

在仓库根目录执行：

```sh
./blog/build-blog.sh
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s blog/tests
git diff --check
python3 -m http.server 8765 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8765/blog/index.html`，检查文章、配图、公式、原稿按钮和日历。结束预览服务按 Ctrl+C。构建会同步文章页面、列表、首页卡片和旧网址跳转页；月历与年历自动读取文章日期。原稿预览会与源文件同目录生成，保留相对图片路径。

## 5. 自行提交与推送

当前本地分支为 `main`，远程名称为 `Kikihqq`，指向 `Kikihqq/Kikihqq.github.io`。先审阅修改：

```sh
git status --short
git diff --stat
git diff
```

确认所有更改都需要发布后，逐个暂存相关文件，示例：

```sh
git add blog/posts/2026-11-10-my-note blog/2026-11-10-my-note.html blog/index.html index.html
git diff --cached --stat
git commit -m "Add new blog note"
git push Kikihqq main
```

本次首次发布“初始笔记”功能时，还需暂存并提交 `blog/build_blog.py`、`blog/article-template.html`、`blog/original-template.html`、`blog/article.css`、测试和文档，以及两篇文章的原稿与生成页面。仓库目前还有之前的未提交改动，请按 `git status` 审阅，不要只提交页面而遗漏样式、脚本或附件。

本地未发现 `.github/workflows` 发布配置。GitHub 仓库 Settings → Pages 的实际发布来源需要你在网页确认：若为分支发布，应指向 `main` 的根目录；若使用 Actions，则按现有工作流发布。推送后检查 GitHub 上的部署状态；不要将本地构建成功等同于线上发布成功。

两份 PDF 约为 14 MB、38 MB，已原样保留。后续图片较多的原稿可先压缩，以减少仓库体积与移动端加载时间。提交公开仓库前请确认原稿内容可公开。
