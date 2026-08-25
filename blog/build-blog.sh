#!/bin/sh
set -eu

# 所有博客正文统一来自 posts/ 中的 Markdown，并由同一模板与样式生成。
pandoc posts/2026-04-24-robust-geometric-models-in-the-wild.md \
  --from=gfm \
  --to=html5 \
  --standalone \
  --toc \
  --toc-depth=2 \
  --template=article-template.html \
  --metadata-file=robust-geometry-metadata.yaml \
  --output=2026-04-24-robust-geometric-models-in-the-wild.html
