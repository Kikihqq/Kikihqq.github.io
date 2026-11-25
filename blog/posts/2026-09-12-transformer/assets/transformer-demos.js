(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function stepControls(root, render) {
    const steps = [...root.querySelectorAll('[data-step]')];
    const play = root.querySelector('[data-play]');
    const status = root.querySelector('[data-status]');
    const playback = root.querySelector('[data-play-state]');
    const last = steps.length - 1;
    let current = 0;
    let timer;
    let seen = false;

    function show(index, announce = false) {
      current = index;
      status.setAttribute('aria-live', announce ? 'polite' : 'off');
      steps.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      render(steps[index].dataset.step);
    }

    function describePlayback(label) {
      playback.textContent = `${label} · ${current + 1} / ${steps.length}`;
    }

    function stop(label) {
      window.clearInterval(timer);
      timer = undefined;
      root.toggleAttribute('data-playing', false);
      play.textContent = current === last ? '重播' : label === '已暂停' ? '继续播放' : '播放';
      describePlayback(label);
    }

    function start() {
      seen = true;
      show(current === last ? 0 : current);
      root.toggleAttribute('data-playing', true);
      play.textContent = '暂停';
      describePlayback('播放中');
      timer = window.setInterval(() => {
        show(current + 1);
        if (current === last) stop('播放结束');
        else describePlayback('播放中');
      }, 1500);
    }

    steps.forEach((button, index) => button.addEventListener('click', () => {
      seen = true;
      show(index, true);
      stop('手动查看');
    }));
    play.addEventListener('click', () => {
      if (timer === undefined) start();
      else stop('已暂停');
    });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting && timer !== undefined) stop('已暂停');
        else if (entry.isIntersecting && !seen && !reduceMotion.matches) start();
      }, { threshold: 0.5 });
      observer.observe(root);
    }
    show(0);
    describePlayback('待播放');

    return () => {
      seen = true;
      show(current, true);
      stop('手动查看');
    };
  }

  const attention = document.querySelector('[data-tf-demo="attention"]');
  if (attention) {
    const size = 8;
    const grid = attention.querySelector('[data-grid]');
    const status = attention.querySelector('[data-status]');
    let query = 27;

    const patches = Array.from({ length: size ** 2 }, (_, index) => {
      const patch = document.createElement('button');
      patch.type = 'button';
      patch.setAttribute('aria-label', `第 ${Math.floor(index / size) + 1} 行，第 ${index % size + 1} 列`);
      patch.addEventListener('click', () => selectPatch(index));
      grid.append(patch);
      return patch;
    });

    const updateManually = stepControls(attention, mode => {
      const offset = mode === 'shift' ? 2 : 0;
      const windowIndex = coordinate => Math.floor((coordinate + offset) / 4);
      const queryRow = Math.floor(query / size);
      const queryColumn = query % size;
      let count = 0;

      patches.forEach((patch, index) => {
        const row = Math.floor(index / size);
        const column = index % size;
        const sameWindow = windowIndex(row) === windowIndex(queryRow)
          && windowIndex(column) === windowIndex(queryColumn);
        const visible = mode === 'global' || sameWindow;
        if (visible) count += 1;
        patch.toggleAttribute('data-visible', visible);
        patch.setAttribute('aria-pressed', String(index === query));
        patch.tabIndex = index === query ? 0 : -1;
      });

      status.textContent = `紫色是查询，可读取 ${count} 个 patch（含自身）。`;
    });

    function selectPatch(index) {
      query = index;
      updateManually();
      patches[query].focus();
    }

    grid.addEventListener('keydown', event => {
      const movement = { ArrowUp: -size, ArrowDown: size, ArrowLeft: -1, ArrowRight: 1 };
      if (!(event.key in movement)) return;
      event.preventDefault();
      selectPatch((query + movement[event.key] + patches.length) % patches.length);
    });
  }

  const mask = document.querySelector('[data-tf-demo="mask"]');
  if (mask) {
    const grid = mask.querySelector('[data-grid]');
    const status = mask.querySelector('[data-status]');
    const patches = Array.from({ length: 196 }, () => {
      const patch = document.createElement('span');
      grid.append(patch);
      return patch;
    });

    stepControls(mask, ratio => {
      const hidden = Math.round(patches.length * Number(ratio) / 100);
      patches.forEach((patch, index) => {
        // Keep the patch order fixed while the mask changes.
        patch.toggleAttribute('data-visible', (index * 67) % patches.length >= hidden);
      });
      status.textContent = `${patches.length - hidden} 块进入编码器，${hidden} 块用于重建损失。`;
    });
  }

  function switchDiagram(root, diagramSelector, descriptions) {
    const diagram = root.querySelector(diagramSelector);
    const status = root.querySelector('[data-status]');
    stepControls(root, mode => {
      diagram.dataset.mode = mode;
      status.textContent = descriptions[mode];
    });
  }

  const prompts = document.querySelector('[data-tf-demo="prompts"]');
  if (prompts) {
    switchDiagram(prompts, '[data-scene]', {
      point: '点提示选中左边的一个红杯。',
      concept: '概念提示选中左右两个红杯。',
      missing: '图中没有黄色杯子，输出空集合。'
    });
  }

  const views = document.querySelector('[data-tf-demo="views"]');
  if (views) {
    switchDiagram(views, '[data-views]', {
      local: '查询来自 A，只读取 A 的图像 token。',
      global: '查询来自 A，可读取三个视角的图像 token。',
      register: '跨帧信息在 register 之间交换。'
    });
  }
})();
