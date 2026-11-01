(function () {
  const $ = id => document.getElementById(id);
  const editor = $('markdownEditor');
  const preview = $('markdownPreview');
  const fields = ['postTitle', 'postDate', 'postCategory', 'postTags', 'postDescription'];
  const storageKey = 'huiqing-blog-markdown-draft-v1';
  const starter = `# A new research note

Write the question that prompted this note and the one idea readers should keep.

## Context

Explain the paper, talk, experiment, or problem in your own words.

## What I learned

- The first observation
- The method or evidence
- The open question

> Use the toolbar to add formatting and Morandi-color wavy underlines.

## References

Add links, citations, slides, or a PDF here.`;

  function escapeHtml(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function inline(value) {
    const waves = [];
    let text = value.replace(/<span class="wave wave-([a-z]+)">([\s\S]*?)<\/span>/g, (_, color, content) => {
      const token = `%%WAVE${waves.length}%%`;
      waves.push(`<span class="wave wave-${color}">${escapeHtml(content)}</span>`);
      return token;
    });
    text = escapeHtml(text)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    waves.forEach((html, i) => { text = text.replace(`%%WAVE${i}%%`, html); });
    return text;
  }

  function renderMarkdown(source) {
    const lines = source.replace(/\r/g, '').split('\n');
    let html = '';
    let inCode = false;
    let code = [];
    let list = null;
    const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
    for (const raw of lines) {
      if (raw.startsWith('```')) {
        closeList();
        if (inCode) { html += `<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`; code = []; }
        inCode = !inCode;
        continue;
      }
      if (inCode) { code.push(raw); continue; }
      if (!raw.trim()) { closeList(); continue; }
      const heading = raw.match(/^(#{1,3})\s+(.+)$/);
      if (heading) { closeList(); const level = heading[1].length; html += `<h${level}>${inline(heading[2])}</h${level}>`; continue; }
      const quote = raw.match(/^>\s?(.*)$/);
      if (quote) { closeList(); html += `<blockquote><p>${inline(quote[1])}</p></blockquote>`; continue; }
      const unordered = raw.match(/^[-*]\s+(.+)$/);
      const ordered = raw.match(/^\d+\.\s+(.+)$/);
      if (unordered || ordered) {
        const type = unordered ? 'ul' : 'ol';
        if (list !== type) { closeList(); list = type; html += `<${type}>`; }
        html += `<li>${inline((unordered || ordered)[1])}</li>`;
        continue;
      }
      closeList();
      html += `<p>${inline(raw)}</p>`;
    }
    closeList();
    if (inCode) html += `<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`;
    return html;
  }

  function update() {
    preview.innerHTML = renderMarkdown(editor.value);
    const characters = editor.value.length;
    const words = editor.value.trim() ? editor.value.trim().split(/\s+/).length : 0;
    $('wordCount').textContent = `${words} words · ${characters} characters`;
    const draft = { body: editor.value };
    fields.forEach(id => { draft[id] = $(id).value; });
    localStorage.setItem(storageKey, JSON.stringify(draft));
    $('saveStatus').textContent = 'Draft saved locally';
  }

  function insert(before, after = '') {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selected = editor.value.slice(start, end) || 'text';
    editor.setRangeText(before + selected + after, start, end, 'end');
    editor.focus();
    update();
  }

  function prefixLines(prefix) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const lineStart = editor.value.lastIndexOf('\n', start - 1) + 1;
    const selected = editor.value.slice(lineStart, end || start);
    editor.setRangeText(selected.split('\n').map(line => prefix + line).join('\n'), lineStart, end || start, 'end');
    editor.focus();
    update();
  }

  document.querySelectorAll('[data-wrap]').forEach(button => button.addEventListener('click', () => {
    const [before, after] = button.dataset.wrap.split('|');
    insert(before, after);
  }));
  document.querySelectorAll('[data-prefix]').forEach(button => button.addEventListener('click', () => prefixLines(button.dataset.prefix)));
  document.querySelectorAll('[data-wave]').forEach(button => button.addEventListener('click', () => insert(`<span class="wave wave-${button.dataset.wave}">`, '</span>')));

  function frontmatter() {
    const tags = $('postTags').value.split(',').map(tag => tag.trim()).filter(Boolean).join(', ');
    return `---\ntitle: ${$('postTitle').value || 'Untitled note'}\ndate: ${$('postDate').value}\ndescription: ${$('postDescription').value}\ncategory: ${$('postCategory').value || 'NOTES'}\ntags: [${tags}]\ncolor: white\nformat: markdown\n---\n\n`;
  }
  function completeMarkdown() { return frontmatter() + editor.value.trim() + '\n'; }
  function slugify(value) { return value.toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'untitled-note'; }

  $('exportMarkdown').addEventListener('click', () => {
    const blob = new Blob([completeMarkdown()], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${$('postDate').value || 'draft'}-${slugify($('postTitle').value)}.md`;
    link.click();
    URL.revokeObjectURL(link.href);
  });
  $('copyMarkdown').addEventListener('click', async () => {
    await navigator.clipboard.writeText(completeMarkdown());
    $('saveStatus').textContent = 'Markdown copied';
  });
  $('importFile').addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const source = String(reader.result);
      const match = source.match(/^---\n([\s\S]*?)\n---\n?/);
      if (match) {
        const meta = {};
        match[1].split('\n').forEach(line => { const i = line.indexOf(':'); if (i > -1) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim(); });
        $('postTitle').value = meta.title || '';
        $('postDate').value = meta.date || '';
        $('postDescription').value = meta.description || '';
        $('postCategory').value = meta.category || '';
        $('postTags').value = (meta.tags || '').replace(/^\[|\]$/g, '');
        editor.value = source.slice(match[0].length).trim();
      } else editor.value = source;
      update();
    };
    reader.readAsText(file);
  });
  $('clearDraft').addEventListener('click', () => {
    if (!window.confirm('Reset this local draft?')) return;
    localStorage.removeItem(storageKey);
    editor.value = starter;
    fields.forEach(id => { $(id).value = ''; });
    $('postDate').value = new Date().toISOString().slice(0, 10);
    update();
  });

  editor.addEventListener('input', update);
  fields.forEach(id => $(id).addEventListener('input', update));
  const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if (saved) {
    editor.value = saved.body || starter;
    fields.forEach(id => { $(id).value = saved[id] || ''; });
  } else {
    editor.value = starter;
    $('postDate').value = new Date().toISOString().slice(0, 10);
  }
  update();
})();
