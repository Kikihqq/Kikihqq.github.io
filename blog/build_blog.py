#!/usr/bin/env python3
"""Build Markdown posts, the Blog index, and the homepage latest-three cards."""

from __future__ import annotations

import html
import re
import subprocess
import os
from urllib.parse import quote
from urllib.parse import urlsplit
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
    if data.get("note-type") and data["note-type"] not in ("Talk Notes", "Paper Notes", "Learning Reflections", "Uncategorized"):
        raise ValueError(f"{path.name}: note-type 必须是Talk Notes、Paper Notes、Learning Reflections或Uncategorized")
    return data


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def kind(post: dict) -> str:
    return str(post.get("format", "markdown")).upper()


def resource_actions(post: dict, prefix: str = "") -> str:
    actions = [f'<a href="{prefix}{esc(post["url"])}">Read notes →</a>']
    document = post.get("document")
    preview = post.get("preview")
    def resource_url(value):
        if not value:
            return value
        value = str(value)
        if urlsplit(value).scheme or value.startswith(("/", "#")):
            return value
        return prefix + post["url"].rsplit("/", 1)[0] + "/" + value
    document, preview = resource_url(document), resource_url(preview)
    post_format = str(post.get("format", "markdown")).lower()
    if preview:
        actions.append(f'<a href="{esc(preview)}" target="_blank" rel="noopener">View PDF ↗</a>')
    if document:
        label = "View PDF ↗" if post_format == "pdf" else "Download slides ↓"
        actions.append(f'<a href="{esc(document)}" target="_blank" rel="noopener">{label}</a>')
    return "".join(actions)


def build_original(path: Path, meta: dict) -> str:
    value = meta.get('original-notes')
    if not value:
        return ''
    source = (path.parent / str(value)).resolve()
    if path.parent.resolve() not in source.parents or not source.is_file():
        raise ValueError(f'{path}: original-notes 必须是本文章目录内存在的文件')
    if source == path.resolve() or source.suffix.lower() not in ('.pdf', '.md', '.markdown'):
        raise ValueError(f'{path}: 原稿必须是独立的 PDF 或 Markdown 文件')
    target = source
    if source.suffix.lower() != '.pdf':
        target = source.with_suffix('.preview.html')
        blog_root = Path(os.path.relpath(BLOG, source.parent)).as_posix() + '/'
        back = Path(os.path.relpath(path.parent / 'index.html', source.parent)).as_posix()
        subprocess.run([
            'pandoc', str(source), '--from=markdown', '--to=html5', '--standalone',
            '--toc', '--toc-depth=6', '--mathml',
            f'--template={BLOG / "original-template.html"}',
            f'--variable=blog-root:{blog_root}', f'--variable=article-url:{quote(back)}',
            f'--variable=original-file:{quote(source.name)}',
            '--metadata=title:Original notes', f'--output={target}',
        ], check=True)
    return quote(target.relative_to(path.parent.resolve()).as_posix())


def build_post(path: Path) -> dict:
    meta = metadata(path)
    slug = path.parent.name
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", slug):
        raise ValueError(f"Invalid article folder name: {slug}")
    output = path.parent / "index.html"
    original_url = build_original(path, meta)
    subprocess.run([
        "pandoc", str(path),
        "--from=" + ("markdown+tex_math_single_backslash" if meta.get("math-backslash") == "true" else "markdown"),
        "--to=html5",
        "--standalone", "--toc", f"--toc-depth={meta.get('toc-depth', 2)}", "--mathml",
        f"--lua-filter={BLOG / 'math-compat.lua'}",
        f"--template={BLOG / 'article-template.html'}",
        "--variable=blog-root:../../", "--variable=site-root:../../../",
        f"--variable=original-url:{original_url}",
        f"--output={output}",
    ], check=True)
    clean = "\n".join(line.rstrip() for line in output.read_text(encoding="utf-8").splitlines()) + "\n"
    equation_number = 0
    def number_equation(match):
        nonlocal equation_number
        equation_number += 1
        return (f'<span class="numbered-equation" id="equation-{equation_number}">'
                f'<span class="equation-expression">{match.group(0)}</span>'
                f'<span class="equation-number" aria-label="Equation {equation_number}">'
                f'({equation_number})</span></span>')
    clean = re.sub(r'<math\b[^>]*display="block"[^>]*>.*?</math>',
                   number_equation, clean, flags=re.DOTALL)
    output.write_text(clean, encoding="utf-8")
    # Keep old bookmarks working, including section fragments and query strings.
    target = f"posts/{slug}/index.html"
    (BLOG / (slug + ".html")).write_text(
        '<!DOCTYPE html>\n<html lang="zh-CN"><head><meta charset="utf-8">'
        f'<title>{esc(meta["title"])}</title>'
        f'<meta http-equiv="refresh" content="0;url={target}">'
        '</head><body>'
        f'<p>文章已整理至新目录：<a href="{target}">{esc(meta["title"])}</a></p>'
        f'<script>location.replace("{target}" + location.search + location.hash);</script>'
        '</body></html>\n', encoding="utf-8")
    meta["slug"] = slug
    meta["url"] = target
    meta["date_sort"] = datetime.strptime(str(meta["date"]), "%Y-%m-%d")
    return meta


def entry(post: dict) -> str:
    tags = " ".join(f'<span>#{esc(tag)}</span>' for tag in post.get("tags", []))
    topic = esc(post.get("topic", "General"))
    year = post["date_sort"].strftime("%Y")
    return f'''      <article class="blog-entry" data-topic="{topic}" data-year="{year}" data-note-type="{esc(post.get('note-type', 'Uncategorized'))}">
        <div class="blog-entry-rail">
          <span class="blog-entry-kind">{esc(post.get("note-type", "Uncategorized"))}</span>
          <span class="blog-entry-topic">{topic}</span>
          <time datetime="{esc(post['date'])}">{post['date_sort'].strftime('%b')} {post['date_sort'].day}, {year}</time>
        </div>
        <div class="blog-entry-copy">
          <h2><a href="{esc(post['url'])}">{esc(post['title'])}</a></h2>
          <p class="blog-entry-tags">{tags}</p>
          <p class="blog-entry-summary">{esc(post['description'])}</p>
          <div class="blog-entry-actions">{resource_actions(post)}</div>
        </div>
      </article>'''


def card(post: dict, position: int) -> str:
    topic = esc(post.get("topic", "General"))
    date = post["date_sort"]
    display_date = f"{date.year}-{date.month}-{date.day}"
    return f'''          <article class="blog-card">
            <div class="blog-card-meta"><span class="blog-kind">{topic}</span><time datetime="{esc(post['date'])}">{display_date}</time></div>
            <h3>{esc(post['title'])}</h3>
            <p>{esc(post['description'])}</p>
            <div class="blog-card-actions">{resource_actions(post, 'blog/')}</div>
          </article>'''


def build_index(posts: list[dict]) -> None:
    items = "\n".join(entry(post) for post in posts)
    requested_topics = ["3DV", "Robotics", "World Model"]
    extra_topics = sorted({str(post.get("topic", "General")) for post in posts} - set(requested_topics))
    topic_names = ["All"] + requested_topics + extra_topics
    topic_buttons = "".join(
        f'<button type="button" class="filter-button{" active" if topic == "All" else ""}" data-topic-filter="{esc(topic)}">{esc(topic)}</button>'
        for topic in topic_names
    )
    note_types = ["Talk Notes", "Paper Notes", "Learning Reflections"]
    if any(not post.get("note-type") or post["note-type"] == "Uncategorized" for post in posts):
        note_types.append("Uncategorized")
    note_buttons = '<button type="button" class="filter-button active" data-note-filter="All">All categories</button>' + "".join(
        f'<button type="button" class="filter-button" data-note-filter="{esc(value)}">{esc(value)}</button>' for value in note_types
    )
    years = sorted({post["date_sort"].strftime("%Y") for post in posts}, reverse=True)
    year_buttons = '<button type="button" class="filter-button active" data-year-filter="All">All years</button>' + "".join(
        f'<button type="button" class="filter-button" data-year-filter="{year}">{year}</button>' for year in years
    )
    page = f'''<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Blog | Huiqing Zhang</title><meta name="description" content="Research notes and paper readings from Huiqing Zhang." />
<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="../assets/css/style.css?v=20261102-2" /><link rel="stylesheet" href="index.css?v=20261109-3" /><link rel="icon" type="image/svg+xml" href="../assets/images/favicon.svg" /></head>
<body><nav class="nav"><div class="nav-inner"><a href="../index.html#top" class="nav-brand">Huiqing&nbsp;Zhang</a><ul class="nav-links"><li><a href="../index.html#about">About</a></li><li><a href="../index.html#publications">Publications</a></li><li><a href="../cv.html">CV</a></li><li><a href="index.html" class="active">Blog</a></li></ul></div></nav>
<main class="blog-index-shell"><header class="blog-index-header"><div class="blog-index-top"><a href="../index.html" class="blog-back-link">Back home</a><div class="blog-tool-links"><a href="mindmap.html" class="blog-map-link">Mind Map</a><a href="editor.html" class="blog-write-link">Write Notes</a></div></div><h1 class="visually-hidden">Blog archive</h1></header>
<section class="blog-filters" aria-label="Blog filters"><div class="filter-group note-types"><span>Categories</span><div>{note_buttons}</div></div><div class="filter-group"><span>Topics</span><div>{topic_buttons}</div></div><div class="filter-group"><span>Archive</span><div>{year_buttons}</div></div></section>
<section class="blog-feed" aria-label="博客文章">\n{items}\n</section><p id="blogEmpty" class="blog-empty" role="status" hidden>No posts match these filters. Try another category, topic, or year.</p></main>
<footer class="footer"><p>© <span id="year"></span> Huiqing Zhang. Built with care · Hosted on GitHub Pages.</p></footer><script>document.getElementById('year').textContent = new Date().getFullYear();</script><script src="index.js?v=20261109-3"></script></body></html>'''
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
    legacy = [path for path in POSTS.glob("*.md") if path.name != "README.md"]
    if legacy:
        raise ValueError("请将文章放入 posts/<文章名>/index.md：" + ", ".join(p.name for p in legacy))
    sources = sorted(POSTS.glob("*/index.md"))
    if not sources:
        raise ValueError("未找到 posts/<文章名>/index.md，停止构建以避免清空列表")
    posts = [build_post(path) for path in sources]
    posts.sort(key=lambda post: post["date_sort"], reverse=True)
    build_index(posts)
    update_home(posts)
    print(f"Built {len(posts)} post(s); updated Blog index and {min(3, len(posts))} homepage preview(s).")


if __name__ == "__main__":
    main()
