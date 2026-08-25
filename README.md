# Huiqing Zhang — Academic Homepage

A minimalist personal academic homepage in **English**, with a **lotus-purple + misty-blue** scholarly palette on a paper-white background. Single-column, sticky-nav, and entirely static — pure HTML / CSS / JS, no build step, no framework. Push to a GitHub Pages repo and it's online in five minutes.

---

## ✨ Design notes

- **Palette** — paper-white background (`#f7f6fa`, with a barely-perceptible cool cast); lotus purple (`#a594c4` → deep `#7e6aa4`) as the signature accent; misty blue (`#8aa6c2` → `#5e7d9c`) as the secondary. Section title bars are a vertical purple→blue gradient — quiet, but it carries the whole palette in one detail. All colors live as CSS variables at the top of `assets/css/style.css` — change one line, retheme the whole site.
- **Typography** — *Cormorant Garamond* (delicate serif) for titles and accents; *Inter* for body. Cool, clean, and a touch literary.
- **Layout** — single column, ~880px max width, sticky translucent top nav, hero with a ⌀200 round portrait beside the name. Sections separated by hairlines. No gimmicks — the structure is pure academic-page.

---

## 📂 File structure

```
huiqing-zhang-website/
├── index.html                  ← main homepage
├── README.md                   ← this file
├── .gitignore
├── .nojekyll                   ← tells GitHub Pages not to run Jekyll
├── assets/
│   ├── css/style.css           ← all styles (palette tokens at the top)
│   ├── js/main.js              ← smooth-scroll + active-nav highlight
│   └── images/
│       ├── avatar.jpg          ← REPLACE with your photo
│       ├── avatar-placeholder.svg
│       ├── pub-placeholder.svg
│       ├── favicon.svg
│       └── pubs/               ← drop paper teaser images here:
│           ├── birdnerf.jpg
│           ├── rspami.jpg
│           ├── rsba.jpg
│           └── fec.jpg
├── blog/
│   ├── posts/                  ← Markdown 博客源文件（每篇一个 .md）
│   ├── article-template.html   ← 所有文章共用的 HTML 模板
│   ├── article.css             ← 所有文章共用的淡粉色主题
│   ├── build_blog.py           ← 自动生成文章、Blog 列表和主页最新三篇
│   └── build-blog.sh           ← 一键构建入口
└── pubs/                        ← (optional) host your paper PDFs here
```

---

## 🚀 Deploy to GitHub Pages (5 minutes)

Your GitHub username is `Kikihqq`. Two options:

### Option A · Personal homepage (recommended)
URL: `https://kikihqq.github.io/`

1. Create a new public repo on GitHub named **`Kikihqq.github.io`** (exact spelling — that's the magic name GitHub recognizes).
2. From inside this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial homepage"
   git branch -M main
   git remote add origin https://github.com/Kikihqq/Kikihqq.github.io.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Source: Deploy from a branch → main / root → Save**.
4. Wait ~1 minute, then visit `https://kikihqq.github.io/`.

### Option B · Project repo
URL: `https://kikihqq.github.io/<repo-name>/`

Use any repo name (e.g. `homepage`). All paths in this project are relative, so it still works. Same steps as above, just substitute your repo name.

---

## ✏️ Editing content

Everything is inside **`index.html`** — search for a section comment like `<!-- ====== NEWS ====== -->` and edit directly.

### Replace the avatar
Drop your photo at `assets/images/avatar.jpg` (square, ≥ 400×400 recommended). Until you do, the page shows a stylish lotus-purple gradient placeholder so it never looks broken.

### Add a news item
Inside `<section id="news">`, add a `<li>` at the top:
```html
<li><span class="news-date">2026 · 03</span> Some happy news here.</li>
```

### Add a publication
Copy any existing `<article class="pub">…</article>` block and edit the title, authors, venue, and links. Drop the paper's teaser image into `assets/images/pubs/` (any aspect ratio — it's cropped to 4:3 automatically).

### Add a blog post

Blog 内容不再直接编辑 HTML。所有文章均由 `blog/posts/` 中的 Markdown 自动生成，并使用同一套淡粉色学术主题。

详细步骤见下方“新增 Blog”章节。

### Add your CV
Save your PDF as `assets/cv.pdf` — the "CV" pill in the hero already links there.

### Update social links
In the `.hero-icons` block of `index.html`, replace the placeholder Google Scholar URL with your real one. The GitHub link is already wired up to `https://github.com/Kikihqq`.

---

## 🎨 Re-theming in one place

All colors live as CSS variables at the top of `assets/css/style.css`:

```css
:root {
  --bg:           #f7f6fa;   /* paper-white background */
  --lotus:        #a594c4;   /* signature lotus purple */
  --lotus-deep:   #7e6aa4;   /* hover / strong accents */
  --lotus-soft:   #ece6f4;   /* tags / backgrounds */
  --mist:         #8aa6c2;   /* secondary misty blue */
  --mist-deep:    #5e7d9c;
  --mist-soft:    #e3eaf2;
  ...
}
```

Want a warmer feel? Try `--lotus: #c2a8b4` (mauve-pink) and `--mist: #b8a890` (warm taupe). Want crisper academic neutrals? `--lotus: #6b6b8a` (slate-violet) and `--mist: #7d8a9a` (cool grey). Nothing else needs editing.

---

## 📱 Responsive

Single breakpoint at 760px — the hero stacks, the timeline collapses, publication cards become single-column. Tested in Chrome / Safari / Firefox.

---

## 中文速查

- 头像：替换 `assets/images/avatar.jpg`
- News：在 `<section id="news">` 加 `<li>`
- 论文：复制一个 `<article class="pub">` 块改字即可，论文配图放进 `assets/images/pubs/`
- 博客：将图片放入 `assets/images/blog/`，将 Markdown 放入 `blog/posts/`，然后运行 `./blog/build-blog.sh`
- 配色：`assets/css/style.css` 顶部的 `:root` 变量
- 部署：仓库命名为 `Kikihqq.github.io` → push → Settings 里开 Pages → 访问 `https://kikihqq.github.io/`

---

## 新增 Blog：只需图片和 Markdown

### 1. 放入图片

为文章建立单独的图片目录，例如：

```text
assets/images/blog/my-new-post/
├── 01-cover.png
├── 02-method.png
└── 03-result.png
```

没有图片也可以；删除 Markdown 元信息中的 `gallery` 字段即可。

### 2. 新建 Markdown

在 `blog/posts/` 中新建文件。文件名会成为最终网址，建议使用：

```text
YYYY-MM-DD-英文短标题.md
```

例如 `blog/posts/2026-07-19-my-new-post.md`：

```markdown
---
title: 文章标题
date: 2026-07-19
date-display: 2026 · 07 · 19
description: 用一句话介绍这篇文章；它会同时显示在主页预览和 Blog 列表中。
category: RESEARCH NOTES · 04
tags: [3D Vision, Paper Reading]
color: pink
gallery:
  - ../assets/images/blog/my-new-post/01-cover.png
  - ../assets/images/blog/my-new-post/02-method.png
  - ../assets/images/blog/my-new-post/03-result.png
---

## 摘要

从这里开始写 Markdown 正文。

## 第一节

正文支持标题、列表、引用、表格、代码块和行内代码。
```

元信息说明：

- `title`：文章标题，必填。
- `date`：发布日期，格式必须为 `YYYY-MM-DD`，必填；列表会按此日期倒序排列。
- `date-display`：文章页中显示的日期格式，可自行修改。
- `description`：一句话简介，必填；主页和 Blog 列表共用。
- `category`：标题上方的小分类文字，可选。
- `tags`：Blog 列表中的标签，可选。
- `color`：主页预览底色，可选 `pink`、`sand` 或 `sage`。
- `gallery`：文章顶部图片列表，可选；图片支持横向滑动、点击放大和左右切换。

### 3. 一键生成

在项目根目录运行：

```bash
./blog/build-blog.sh
```

脚本会自动完成：

1. 将 `blog/posts/*.md` 生成统一主题的 HTML 文章。
2. 按发布日期更新 `blog/index.html`，每篇文章占一整行。
3. 将最新三篇文章同步到主页 Blog 模块；超过三篇时主页只显示最新三篇。
4. 为每篇文章生成统一目录、字体、标题、简介和图片画廊。

运行环境需要 Python 3 和 Pandoc。更新 Markdown 或图片后，再运行一次相同命令即可。

---

## License

Code released under the MIT License — feel free to adapt it for your own homepage. Content (text, photos, publications) belongs to Huiqing Zhang.
