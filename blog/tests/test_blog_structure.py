"""Run after build-blog.sh; no third-party test dependencies."""
import importlib.util
import unittest
import tempfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

BLOG = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("blog_builder", BLOG / "build_blog.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        self.urls.extend(value for key, value in attrs if key in ("src", "href") and value)


class BlogStructureTests(unittest.TestCase):
    def test_original_notes_preview(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            article = folder / 'index.md'
            article.write_text('Article')
            self.assertEqual(builder.build_original(article, {}), '')
            with self.assertRaises(ValueError):
                builder.build_original(article, {'original-notes': 'missing.pdf'})
            source = folder / '笔记.md'
            source.write_text('# 示例标题\n\n**重点**\n\n![图](figure.svg)\n\n$x^2$\n')
            url = builder.build_original(article, {'original-notes': '笔记.md'})
            preview = folder / unquote(url)
            output = preview.read_text()
            self.assertIn('<strong>重点</strong>', output)
            self.assertIn('src="figure.svg"', output)
            self.assertIn('<math', output)
            self.assertIn('返回博客文章', output)
            with self.assertRaises(ValueError):
                builder.build_original(article, {'original-notes': 'index.md'})

    def test_learning_note_citations(self):
        class CitationLinks(HTMLParser):
            def __init__(self):
                super().__init__()
                self.current = None
                self.links = []
                self.span_stack = []
                self.groups = []
                self.grouped_urls = set()

            def handle_starttag(self, tag, attrs):
                attrs = dict(attrs)
                if tag == 'span':
                    group = [] if 'citation-group' in attrs.get('class', '').split() else None
                    self.span_stack.append(group)
                    if group is not None:
                        self.groups.append(group)
                if tag == 'a':
                    self.current = [attrs.get('href', ''), '']
                    if any(group is not None for group in self.span_stack):
                        self.grouped_urls.add(self.current[0])

            def handle_data(self, data):
                for group in self.span_stack:
                    if group is not None:
                        group.append(data)
                if self.current is not None:
                    self.current[1] += data

            def handle_endtag(self, tag):
                if tag == 'span' and self.span_stack:
                    self.span_stack.pop()
                if tag == 'a' and self.current is not None:
                    self.links.append(self.current)
                    self.current = None

        for folder in (BLOG / 'posts').glob('2026-08-05-*'):
            source = (folder / 'index.md').read_text()
            self.assertIn('## 8. 总结', source)
            self.assertNotIn('原稿', source)
            parser = CitationLinks()
            parser.feed((folder / 'index.html').read_text())
            citations = [(url, label) for url, label in parser.links if url.startswith('https://')]
            self.assertTrue(citations)
            for url, label in citations:
                with self.subTest(article=folder.name, url=url):
                    self.assertTrue(url in parser.grouped_urls or (label.startswith('[') and label.endswith(']')), label)
            self.assertTrue(parser.groups)
            for group in parser.groups:
                text = ''.join(group)
                self.assertTrue(text.startswith('[') and text.endswith(']'), text)
                self.assertEqual(text.count('['), 1)
                self.assertEqual(text.count(']'), 1)
                self.assertIn('、', text)
            cross_links = [label for url, label in parser.links if url.startswith('../2026-08-05-')]
            self.assertTrue(cross_links)
            self.assertTrue(all(label.startswith('《') and label.endswith('》') for label in cross_links))

    def test_archive_categories(self):
        page = (BLOG / "index.html").read_text()
        for category in ("Talk Notes", "Paper Notes", "Learning Reflections"):
            self.assertIn(f'data-note-filter="{category}"', page)
        self.assertIn('id="blogEmpty"', page)
        post = dict(title="Example", slug="example", url="posts/example/index.html",
                    date="2026-08-05", date_sort=builder.datetime(2026, 8, 5),
                    description="Test", topic="3DV", **{"note-type": "Paper Notes"})
        self.assertIn('data-note-type="Paper Notes"', builder.entry(post))
        rendered = builder.entry(post)
        self.assertIn('<span class="blog-entry-kind">Paper Notes</span>', rendered)
        self.assertNotIn('blog-entry-note-type', rendered)
        self.assertNotIn('MARKDOWN', rendered)
        self.assertIn('>Aug 5, 2026</time>', rendered)
        self.assertIn('datetime="2026-08-05"', rendered)

    def test_articles_and_local_resources(self):
        sources = list((BLOG / "posts").glob("*/index.md"))
        self.assertTrue(sources)
        pages = [BLOG / "index.html", BLOG.parent / "index.html"]
        for source in sources:
            builder.metadata(source)
            page = source.with_suffix(".html")
            self.assertTrue(page.exists())
            pages.append(page)
            redirect = BLOG / (source.parent.name + ".html")
            self.assertIn(f'posts/{source.parent.name}/index.html', redirect.read_text())
            self.assertIn('location.hash', redirect.read_text())
        for page in pages:
            parser = Links()
            parser.feed(page.read_text())
            for url in parser.urls:
                parts = urlsplit(url)
                if parts.scheme or parts.netloc or not parts.path or parts.path.startswith('/'):
                    continue
                with self.subTest(page=page.name, url=url):
                    self.assertTrue((page.parent / unquote(parts.path)).exists())

    def test_document_card_paths(self):
        post = dict(url="posts/example/index.html", document="assets/slides.pptx",
                    preview="assets/slides.pdf", format="slides")
        for prefix in ("", "blog/"):
            result = builder.resource_actions(post, prefix)
            self.assertIn(prefix + "posts/example/assets/slides.pdf", result)
            self.assertIn(prefix + "posts/example/assets/slides.pptx", result)
        post['preview'] = "https://example.com/document.pdf"
        self.assertIn('href="https://example.com/document.pdf"', builder.resource_actions(post))


if __name__ == "__main__":
    unittest.main()
