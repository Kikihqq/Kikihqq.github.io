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
│   └── post-template.html      ← duplicate to write new posts
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
1. Duplicate `blog/post-template.html` and rename it (e.g. `blog/2026-03-3dgs-notes.html`).
2. Edit the title, date, and body.
3. In `index.html` under `<section id="blog">`, copy one of the `<a class="blog-card">` blocks and point its `href` to your new file.

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
- 博客：复制 `blog/post-template.html` 改名，然后在主页 `#blog` 段加一张卡片指向它
- 配色：`assets/css/style.css` 顶部的 `:root` 变量
- 部署：仓库命名为 `Kikihqq.github.io` → push → Settings 里开 Pages → 访问 `https://kikihqq.github.io/`

---

## License

Code released under the MIT License — feel free to adapt it for your own homepage. Content (text, photos, publications) belongs to Huiqing Zhang.
