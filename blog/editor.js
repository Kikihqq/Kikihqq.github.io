(function () {
  const $ = id => document.getElementById(id);
  const editor = $('markdownEditor');
  const preview = $('markdownPreview');
  const fields = ['postTitle', 'postDate', 'postCategory', 'postTopic', 'postTags', 'postDescription'];
  const storageKey = 'huiqing-blog-markdown-draft-v1';
  const starter = `# A new research note

Write the question that prompted this note and the one idea readers should keep.

## Context

Explain the paper, talk, experiment, or problem in your own words.

## What I learned

- The first observation
- The method or evidence
- The open question

> Use the toolbar to add formatting, background highlights, and several underline styles.

## References

Add links, citations, slides, or a PDF here.`;

  function escapeHtml(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  const mathSymbols = {
    times: '×', div: '÷', neq: '≠', approx: '≈', le: '≤', ge: '≥',
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', theta: 'θ', lambda: 'λ',
    mu: 'μ', pi: 'π', sigma: 'σ', omega: 'ω', infty: '∞', partial: '∂',
    nabla: '∇', in: '∈', notin: '∉', subset: '⊂', cup: '∪', cap: '∩',
    forall: '∀', exists: '∃', rightarrow: '→', to: '→'
  };
  const largeMathSymbols = { sum: '∑', prod: '∏', int: '∫' };

  function latexToMathML(source, display = false) {
    let index = 0;
    const input = String(source || '');
    const operatorCharacters = new Set(['+', '-', '=', '<', '>', '(', ')', '[', ']', '{', '}', ',', '|']);
    const group = () => {
      while (input[index] === ' ') index += 1;
      if (input[index] === '{') {
        index += 1;
        const content = sequence('}');
        if (input[index] === '}') index += 1;
        return `<mrow>${content}</mrow>`;
      }
      return atom();
    };
    const scripts = base => {
      let sub = '';
      let sup = '';
      while (input[index] === '_' || input[index] === '^') {
        const type = input[index++];
        const value = group();
        if (type === '_') sub = value;
        else sup = value;
      }
      if (sub && sup) return `<msubsup>${base}${sub}${sup}</msubsup>`;
      if (sub) return `<msub>${base}${sub}</msub>`;
      if (sup) return `<msup>${base}${sup}</msup>`;
      return base;
    };
    const command = () => {
      index += 1;
      const match = input.slice(index).match(/^[A-Za-z]+/);
      if (!match) {
        const escaped = input[index++] || '';
        return `<mo>${escapeHtml(escaped)}</mo>`;
      }
      const name = match[0];
      index += name.length;
      while (input[index] === ' ') index += 1;
      if (name === 'frac') return `<mfrac>${group()}${group()}</mfrac>`;
      if (name === 'sqrt') return `<msqrt>${group()}</msqrt>`;
      if (name === 'left' || name === 'right') return '';
      if (name === 'mathrm' || name === 'mathbf') {
        const content = group();
        return `<mstyle mathvariant="${name === 'mathbf' ? 'bold' : 'normal'}">${content}</mstyle>`;
      }
      if (name === 'lim') return '<mi mathvariant="normal">lim</mi>';
      if (largeMathSymbols[name]) return `<mo largeop="true">${largeMathSymbols[name]}</mo>`;
      if (mathSymbols[name]) {
        const tag = /^[a-z]+$/.test(name) && !['infty', 'partial', 'nabla'].includes(name) ? 'mi' : 'mo';
        return `<${tag}>${mathSymbols[name]}</${tag}>`;
      }
      return `<mtext>\\${escapeHtml(name)}</mtext>`;
    };
    const atom = () => {
      while (input[index] === ' ') index += 1;
      const character = input[index];
      if (!character) return '<mrow></mrow>';
      let node;
      if (character === '\\') node = command();
      else if (character === '{') node = group();
      else if (/\d/.test(character)) {
        const number = input.slice(index).match(/^\d+(?:\.\d+)?/)[0];
        index += number.length;
        node = `<mn>${number}</mn>`;
      } else if (/[A-Za-z]/.test(character)) {
        index += 1;
        node = `<mi>${character}</mi>`;
      } else {
        index += 1;
        node = operatorCharacters.has(character) ? `<mo>${escapeHtml(character)}</mo>` : `<mi>${escapeHtml(character)}</mi>`;
      }
      return scripts(node);
    };
    const sequence = stop => {
      let result = '';
      while (index < input.length && input[index] !== stop) {
        if (/\s/.test(input[index])) { index += 1; continue; }
        result += atom();
      }
      return result;
    };
    const content = sequence('');
    return `<math xmlns="http://www.w3.org/1998/Math/MathML"${display ? ' display="block"' : ''}><mrow>${content}</mrow></math>`;
  }

  function inline(value) {
    const richText = [];
    const stash = html => {
      const token = `%%RICHTEXT${richText.length}%%`;
      richText.push(html);
      return token;
    };
    let text = value
      .replace(/<span class="wave wave-([a-z]+)">([\s\S]*?)<\/span>/g, (_, color, content) => stash(`<span class="wave wave-${color}">${escapeHtml(content)}</span>`))
      .replace(/<span class="underline underline-(solid|double|dotted|dashed)">([\s\S]*?)<\/span>/g, (_, style, content) => stash(`<span class="underline underline-${style}">${escapeHtml(content)}</span>`))
      .replace(/<mark class="highlight highlight-(pink|cream|yellow|blue|teal|deep)">([\s\S]*?)<\/mark>/g, (_, color, content) => stash(`<mark class="highlight highlight-${color}">${escapeHtml(content)}</mark>`))
      .replace(/\$([^$\n]+)\$/g, (_, formula) => stash(`<span class="math-inline">${latexToMathML(formula)}</span>`));
    text = escapeHtml(text)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+|[^)\s]+)\)/g, '<img src="$2" alt="$1" />')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/~~([^~]+)~~/g, '<s>$1</s>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    richText.forEach((html, i) => { text = text.replace(`%%RICHTEXT${i}%%`, html); });
    return text;
  }

  function renderMarkdown(source) {
    const lines = source.replace(/\r/g, '').split('\n');
    let html = '';
    let inCode = false;
    let inMath = false;
    let code = [];
    let math = [];
    let list = null;
    const closeList = () => { if (list) { html += `</${list}>`; list = null; } };
    for (const raw of lines) {
      if (raw.trim() === '$$' && !inCode) {
        closeList();
        if (inMath) { html += `<div class="math-block">${latexToMathML(math.join('\n'), true)}</div>`; math = []; }
        inMath = !inMath;
        continue;
      }
      if (inMath) { math.push(raw); continue; }
      if (raw.startsWith('```')) {
        closeList();
        if (inCode) { html += `<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`; code = []; }
        inCode = !inCode;
        continue;
      }
      if (inCode) { code.push(raw); continue; }
      if (!raw.trim()) { closeList(); continue; }
      if (/^ {0,3}([-*_])(?:\s*\1){2,}\s*$/.test(raw)) { closeList(); html += '<hr />'; continue; }
      const heading = raw.match(/^(#{1,3})\s+(.+)$/);
      if (heading) { closeList(); const level = heading[1].length; html += `<h${level}>${inline(heading[2])}</h${level}>`; continue; }
      const quote = raw.match(/^>\s?(.*)$/);
      if (quote) { closeList(); html += `<blockquote><p>${inline(quote[1])}</p></blockquote>`; continue; }
      const task = raw.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
      const unordered = raw.match(/^[-*]\s+(.+)$/);
      const ordered = raw.match(/^\d+\.\s+(.+)$/);
      if (task || unordered || ordered) {
        const type = unordered ? 'ul' : 'ol';
        const finalType = task ? 'ul' : type;
        if (list !== finalType) { closeList(); list = finalType; html += `<${finalType}>`; }
        if (task) html += `<li class="task-item"><input type="checkbox" disabled ${task[1].toLowerCase() === 'x' ? 'checked' : ''} /> ${inline(task[2])}</li>`;
        else html += `<li>${inline((unordered || ordered)[1])}</li>`;
        continue;
      }
      closeList();
      html += `<p>${inline(raw)}</p>`;
    }
    closeList();
    if (inCode) html += `<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`;
    if (inMath) html += `<div class="math-block">${latexToMathML(math.join('\n'), true)}</div>`;
    return html;
  }

  function update() {
    preview.innerHTML = renderMarkdown(editor.value);
    $('previewTitle').textContent = $('postTitle').value || 'Untitled note';
    $('previewDate').textContent = $('postDate').value || '';
    $('previewCategory').textContent = $('postCategory').value || 'NOTES';
    $('previewDescription').textContent = $('postDescription').value || 'Your one-line summary will appear here.';
    const characters = editor.value.length;
    const words = editor.value.trim() ? editor.value.trim().split(/\s+/).length : 0;
    $('wordCount').textContent = `${words} words · ${characters} characters`;
    const draft = { body: editor.value };
    fields.forEach(id => { draft[id] = $(id).value; });
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      $('saveStatus').textContent = 'Draft saved locally';
    } catch (error) {
      $('saveStatus').textContent = 'Preview updated · export to keep large images';
    }
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

  function clipboardImageData(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        const maxSide = 1800;
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/webp', .88));
      };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read pasted image')); };
      image.src = url;
    });
  }

  document.querySelectorAll('[data-wrap]').forEach(button => button.addEventListener('click', () => {
    const [before, after] = button.dataset.wrap.split('|');
    insert(before, after);
  }));
  document.querySelectorAll('[data-prefix]').forEach(button => button.addEventListener('click', () => prefixLines(button.dataset.prefix)));
  document.querySelectorAll('[data-wave]').forEach(button => button.addEventListener('click', () => insert(`<span class="wave wave-${button.dataset.wave}">`, '</span>')));
  document.querySelectorAll('[data-highlight]').forEach(button => button.addEventListener('click', () => insert(`<mark class="highlight highlight-${button.dataset.highlight}">`, '</mark>')));
  document.querySelectorAll('[data-underline]').forEach(button => button.addEventListener('click', () => insert(`<span class="underline underline-${button.dataset.underline}">`, '</span>')));
  document.querySelectorAll('[data-insert]').forEach(button => button.addEventListener('click', () => {
    const start = editor.selectionStart;
    editor.setRangeText(button.dataset.insert.replace(/\\n/g, '\n'), start, start, 'end');
    editor.focus();
    update();
  }));
  document.querySelectorAll('[data-template]').forEach(button => button.addEventListener('click', () => {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const template = button.dataset.template.replace(/\\n/g, '\n');
    editor.setRangeText(template, start, end, 'end');
    editor.focus();
    update();
  }));

  const formulaInput = $('formulaInput');
  const formulaMarkdown = $('formulaMarkdown');
  const formulaBuilder = $('formulaBuilder');
  $('formulaToggle').addEventListener('click', () => {
    const willOpen = formulaBuilder.hidden;
    formulaBuilder.hidden = !willOpen;
    $('formulaToggle').setAttribute('aria-expanded', String(willOpen));
    $('formulaToggle').textContent = willOpen ? '∑ 收起公式' : '∑ 公式';
    if (willOpen) formulaInput.focus();
  });
  function updateFormulaMarkdown() {
    const formula = formulaInput.value.trim() || 'E = mc^2';
    formulaMarkdown.innerHTML = latexToMathML(formula, true);
  }
  function insertIntoFormula(value, cursorOffset = value.length) {
    const start = formulaInput.selectionStart;
    const end = formulaInput.selectionEnd;
    formulaInput.setRangeText(value, start, end, 'end');
    const cursor = start + cursorOffset;
    formulaInput.setSelectionRange(cursor, cursor);
    formulaInput.focus();
    updateFormulaMarkdown();
  }
  document.querySelectorAll('[data-formula]').forEach(button => button.addEventListener('click', () => insertIntoFormula(button.dataset.formula)));
  document.querySelectorAll('[data-formula-template]').forEach(button => button.addEventListener('click', () => {
    const template = button.dataset.formulaTemplate;
    const marker = template.indexOf('|');
    insertIntoFormula(template.replace('|', ''), marker < 0 ? template.length : marker);
  }));
  formulaInput.addEventListener('input', updateFormulaMarkdown);
  $('clearFormula').addEventListener('click', () => { formulaInput.value = ''; formulaInput.focus(); updateFormulaMarkdown(); });
  $('insertInlineFormula').addEventListener('click', () => {
    const formula = formulaInput.value.trim();
    if (!formula) return;
    const start = editor.selectionStart;
    editor.setRangeText(`$${formula}$`, start, editor.selectionEnd, 'end');
    editor.focus();
    update();
  });
  $('insertBlockFormula').addEventListener('click', () => {
    const formula = formulaInput.value.trim();
    if (!formula) return;
    const start = editor.selectionStart;
    editor.setRangeText(`\n\n$$\n${formula}\n$$\n\n`, start, editor.selectionEnd, 'end');
    editor.focus();
    update();
  });
  updateFormulaMarkdown();

  editor.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && ['b', 'i'].includes(event.key.toLowerCase())) {
      event.preventDefault();
      event.key.toLowerCase() === 'b' ? insert('**', '**') : insert('*', '*');
    }
    if (event.key === 'Tab') {
      event.preventDefault();
      const start = editor.selectionStart;
      editor.setRangeText('  ', start, editor.selectionEnd, 'end');
      update();
    }
  });

  editor.addEventListener('paste', async event => {
    const imageItem = [...(event.clipboardData?.items || [])].find(item => item.type.startsWith('image/'));
    if (!imageItem) return;
    event.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    $('saveStatus').textContent = 'Preparing pasted image…';
    try {
      const dataUrl = await clipboardImageData(file);
      const markdown = `\n\n![Pasted image](${dataUrl})\n\n`;
      editor.setRangeText(markdown, start, end, 'end');
      editor.focus();
      update();
      $('saveStatus').textContent = 'Image pasted · export Markdown to keep it';
    } catch (error) {
      $('saveStatus').textContent = 'Could not paste this image';
    }
  });

  function frontmatter() {
    const tags = $('postTags').value.split(',').map(tag => tag.trim()).filter(Boolean).join(', ');
    return `---\ntitle: ${$('postTitle').value || 'Untitled note'}\ndate: ${$('postDate').value}\ndescription: ${$('postDescription').value}\ncategory: ${$('postCategory').value || 'NOTES'}\ntopic: ${$('postTopic').value || 'General'}\ntags: [${tags}]\ncolor: white\nformat: markdown\n---\n\n`;
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
        $('postTopic').value = meta.topic || 'General';
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
