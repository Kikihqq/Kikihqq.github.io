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


def kind(post: dict) -> str:
    return str(post.get("format", "markdown")).upper()


def resource_actions(post: dict, prefix: str = "") -> str:
    slug = esc(post["slug"])
    actions = [f'<a href="{prefix}{slug}.html">Read notes →</a>']
    document = post.get("document")
    preview = post.get("preview")
    if prefix == "blog/":
        document = str(document)[3:] if document and str(document).startswith("../") else document
        preview = str(preview)[3:] if preview and str(preview).startswith("../") else preview
    post_format = str(post.get("format", "markdown")).lower()
    if preview:
        actions.append(f'<a href="{esc(preview)}" target="_blank" rel="noopener">View PDF ↗</a>')
    if document:
        label = "View PDF ↗" if post_format == "pdf" else "Download slides ↓"
        actions.append(f'<a href="{esc(document)}" target="_blank" rel="noopener">{label}</a>')
    return "".join(actions)


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
    tags = " ".join(f'<span>#{esc(tag)}</span>' for tag in post.get("tags", []))
    return f'''      <article class="blog-entry">
        <div class="blog-entry-rail">
          <span class="blog-entry-kind">{kind(post)}</span>
          <time datetime="{esc(post['date'])}">{post['date_sort'].strftime('%b %d, %Y')}</time>
        </div>
        <div class="blog-entry-copy">
          <h2><a href="{esc(post['slug'])}.html">{esc(post['title'])}</a></h2>
          <p class="blog-entry-tags">{tags}</p>
          <p class="blog-entry-summary">{esc(post['description'])}</p>
          <div class="blog-entry-actions">{resource_actions(post)}</div>
        </div>
      </article>'''


def card(post: dict, position: int) -> str:
    tags = " ".join(f"#{esc(tag)}" for tag in post.get("tags", [])[:2])
    return f'''          <article class="blog-card">
            <div class="blog-card-meta"><span class="blog-kind">{kind(post)}</span><time datetime="{esc(post['date'])}">{post['date_sort'].strftime('%Y.%m.%d')}</time></div>
            <h3>{esc(post['title'])}</h3>
            <p>{esc(post['description'])}</p>
            <p class="blog-card-tags">{tags}</p>
            <div class="blog-card-actions">{resource_actions(post, 'blog/')}</div>
          </article>'''


def build_index(posts: list[dict]) -> None:
    items = "\n".join(entry(post) for post in posts)
    page = f'''<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Blog | Huiqing Zhang</title><meta name="description" content="Research notes and paper readings from Huiqing Zhang." />
<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../assets/css/style.css" /><link rel="stylesheet" href="index.css" /><link rel="icon" type="image/svg+xml" href="../assets/images/favicon.svg" /></head>
<body><nav class="nav"><div class="nav-inner"><a href="../index.html#top" class="nav-brand">Huiqing&nbsp;Zhang</a><ul class="nav-links"><li><a href="../index.html#about">About</a></li><li><a href="../index.html#publications">Publications</a></li><li><a href="../cv.html">CV</a></li><li><a href="index.html" class="active">Blog</a></li></ul></div></nav>
<main class="blog-index-shell"><header class="blog-index-header"><div class="blog-index-top"><a href="../index.html" class="back-link">← Back to home</a><a href="editor.html" class="blog-write-link">Write a note →</a></div><p class="blog-index-eyebrow">NOTES · SLIDES · DOCUMENTS</p><h1>What I am learning.</h1><p>A public notebook for paper readings, technical presentations, and ideas that become clearer through writing.</p></header>
<section class="blog-feed" aria-label="博客文章">\n{items}\n</section></main>
<footer class="footer"><p>© <span id="year"></span> Huiqing Zhang. Built with care · Hosted on GitHub Pages.</p></footer><script>document.getElementById('year').textContent = new Date().getFullYear();</script></body></html>'''
    (BLOG / "index.html").write_text(page, encoding="utf-8")


def update_home(posts: list[dict]) -> None:
    path = ROOT / "index.html"
    text = path.read_text(encoding="utf-8")
    start = '          <div class="blog-list" id="blogCarousel">'
    end = '          </div>\n          <div class="blog-carousel-controls">'
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
