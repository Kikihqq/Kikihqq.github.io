#!/usr/bin/env python3
"""Build Markdown posts, the Blog index, and the homepage latest-three cards."""

from __future__ import annotations

import html
import re
import subprocess
from datetime import datetime
from pathlib import Path

BLOG = Path(__file__).resolve().parent
ROOT = BLOG.parent
POSTS = BLOG / "posts"


def metadata(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        raise ValueError(f"{path.name}: 缺少 YAML 头部元信息")
    head = text.split("---\n", 2)[1]
    data: dict[str, object] = {}
    current_list = None
    for raw in head.splitlines():
        if raw.startswith("  - ") and current_list:
            data[current_list].append(raw[4:].strip())
            continue
        match = re.match(r"^([\w-]+):\s*(.*)$", raw)
        if not match:
            continue
        key, value = match.groups()
        if not value:
            data[key] = []
            current_list = key
        elif value.startswith("[") and value.endswith("]"):
            data[key] = [item.strip() for item in value[1:-1].split(",") if item.strip()]
            current_list = None
        else:
            data[key] = value.strip().strip('"\'')
            current_list = None
    missing = [key for key in ("title", "date", "description") if not data.get(key)]
    if missing:
        raise ValueError(f"{path.name}: 缺少 {', '.join(missing)}")
    return data


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def build_post(path: Path) -> dict:
    meta = metadata(path)
    slug = path.stem
    subprocess.run([
        "pandoc", str(path), "--from=markdown", "--to=html5",
        "--standalone", "--toc", "--toc-depth=2",
        f"--template={BLOG / 'article-template.html'}",
        f"--output={BLOG / (slug + '.html')}",
    ], check=True)
    output = BLOG / (slug + ".html")
    clean = "\n".join(line.rstrip() for line in output.read_text(encoding="utf-8").splitlines()) + "\n"
    output.write_text(clean, encoding="utf-8")
    meta["slug"] = slug
    meta["date_sort"] = datetime.strptime(str(meta["date"]), "%Y-%m-%d")
    return meta


def entry(post: dict) -> str:
    tags = " &nbsp; ".join(f"#{esc(tag)}" for tag in post.get("tags", []))
    return f'''      <article class="blog-entry">
        <div class="blog-entry-copy">
          <time datetime="{esc(post['date'])}">{post['date_sort'].strftime('%B %d, %Y')}</time>
          <h2><a href="{esc(post['slug'])}.html">{esc(post['title'])}</a></h2>
          <p class="blog-entry-tags">{tags}</p>
          <p class="blog-entry-summary">{esc(post['description'])}</p>
          <a class="blog-entry-more" href="{esc(post['slug'])}.html">阅读全文 <span>→</span></a>
        </div>
      </article>'''


def card(post: dict, position: int) -> str:
    colors = ("pink", "sand", "sage")
    color = post.get("color") or colors[position % len(colors)]
    return f'''          <a class="blog-card blog-card-{esc(color)}" href="blog/{esc(post['slug'])}.html">
            <h3>{esc(post['title'])}</h3>
            <p>{esc(post['description'])}</p>
          </a>'''


def build_index(posts: list[dict]) -> None:
    items = "\n".join(entry(post) for post in posts)
    page = f'''<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Blog | Huiqing Zhang</title><meta name="description" content="Research notes and paper readings from Huiqing Zhang." />
<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../assets/css/style.css" /><link rel="stylesheet" href="index.css" /><link rel="icon" type="image/svg+xml" href="../assets/images/favicon.svg" /></head>
<body><nav class="nav"><div class="nav-inner"><a href="../index.html#top" class="nav-brand">Huiqing&nbsp;Zhang</a><ul class="nav-links"><li><a href="../index.html#about">About</a></li><li><a href="../index.html#publications">Publications</a></li><li><a href="../cv.html">CV</a></li><li><a href="index.html" class="active">Blog</a></li></ul></div></nav>
<main class="blog-index-shell"><header class="blog-index-header"><a href="../index.html" class="back-link">← 返回主页</a><p class="blog-index-eyebrow">RESEARCH NOTES · PAPER READINGS</p><h1>Blog</h1><p>研究笔记、论文阅读，以及一些尚在生长的想法。</p></header>
<section class="blog-feed" aria-label="博客文章">\n{items}\n</section></main>
<footer class="footer"><p>© <span id="year"></span> Huiqing Zhang. Built with care · Hosted on GitHub Pages.</p></footer><script>document.getElementById('year').textContent = new Date().getFullYear();</script></body></html>'''
    (BLOG / "index.html").write_text(page, encoding="utf-8")


def update_home(posts: list[dict]) -> None:
    path = ROOT / "index.html"
    text = path.read_text(encoding="utf-8")
    start = '        <div class="blog-list">'
    end = '        </div>\n        <p class="blog-more">'
    before, remainder = text.split(start, 1)
    _, after = remainder.split(end, 1)
    cards = "\n".join(card(post, i) for i, post in enumerate(posts[:3]))
    path.write_text(before + start + "\n" + cards + "\n" + end + after, encoding="utf-8")


def main() -> None:
    posts = [build_post(path) for path in POSTS.glob("*.md")]
    posts.sort(key=lambda post: post["date_sort"], reverse=True)
    build_index(posts)
    update_home(posts)
    print(f"Built {len(posts)} post(s); updated Blog index and {min(3, len(posts))} homepage preview(s).")


if __name__ == "__main__":
    main()
