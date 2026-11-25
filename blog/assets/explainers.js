/* Original, deterministic teaching diagrams. No network or model inference. */
(() => {
  'use strict';
  document.querySelectorAll('[data-demo="diffusion"]').forEach(root => {
    const canvas = root.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const noise = root.querySelector('[data-noise]');
    const frame = root.querySelector('[data-frame]');
    const noiseTexture = document.createElement('canvas');
    noiseTexture.width = 120;
    noiseTexture.height = 80;
    const noiseCtx = noiseTexture.getContext('2d');
    if (!noiseCtx) return;
    const pixels = noiseCtx.createImageData(120, 80);
    let seed = 101;
    for (let i = 0; i < pixels.data.length; i += 4) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const value = (seed >>> 24);
      pixels.data[i] = value;
      pixels.data[i + 1] = value;
      pixels.data[i + 2] = value;
      pixels.data[i + 3] = 255;
    }
    noiseCtx.putImageData(pixels, 0, 0);
    function draw() {
      const compact = canvas.clientWidth < 430;
      const width = compact ? 360 : 720;
      const height = compact ? 330 : 260;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.scale(ratio, ratio);
      ctx.clearRect(0, 0, width, height);
      const columns = compact ? 2 : 4;
      const tileWidth = (width - 16 * (columns + 1)) / columns;
      const tileHeight = compact ? 118 : 150;
      const selected = Number(frame.value);
      for (let i = 0; i < 4; i++) {
        const x = 16 + (i % columns) * (tileWidth + 16);
        const y = 12 + Math.floor(i / columns) * 160;
        ctx.fillStyle = '#eff5f7';
        ctx.fillRect(x, y, tileWidth, tileHeight);
        ctx.fillStyle = '#e2dbcf';
        ctx.fillRect(x, y + tileHeight * .72, tileWidth, tileHeight * .28);
        ctx.fillStyle = '#ad7480';
        ctx.beginPath();
        ctx.arc(x + 20 + (tileWidth - 40) * i / 3, y + tileHeight * .6, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1 - Number(noise.value) / 100;
        ctx.drawImage(noiseTexture, x, y, tileWidth, tileHeight);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = selected === i ? '#ad7480' : '#e6dfe1';
        ctx.lineWidth = selected === i ? 3 : 1;
        ctx.strokeRect(x, y, tileWidth, tileHeight);
        ctx.fillStyle = '#67545b';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`第 ${i + 1} 帧${selected === i ? ' · 当前' : ''}`, x + tileWidth / 2, y + tileHeight + 23);
      }
      root.querySelector('[data-noise-value]').textContent = `${noise.value}%`;
      root.querySelector('[data-frame-value]').textContent = `第 ${selected + 1} / 4 帧`;
      root.querySelector('.demo-result').textContent = `去噪进度 ${noise.value}%：四帧共享同一噪声水平。当前观察第 ${selected + 1} 帧，球的位置由视频时间决定。`;
    }
    noise.addEventListener('input', draw);
    frame.addEventListener('input', draw);
    if ('ResizeObserver' in window) new ResizeObserver(draw).observe(canvas);
    else window.addEventListener('resize', draw);
    draw();
  });

  document.querySelectorAll('[data-demo="planning"]').forEach(root => {
    const speed = root.querySelector('[data-speed]');
    const friction = root.querySelector('[data-friction]');
    function draw() {
      const v = Number(speed.value) / 10;
      const mu = Number(friction.value) / 100;
      const prediction = v * v / (2 * mu * 9.8);
      const reference = v * v / (2 * .18 * 9.8);
      const modelX = 76 + 70 * prediction;
      const realX = 76 + 70 * reference;
      root.querySelector('[data-model-ball]').setAttribute('cx', modelX);
      root.querySelector('[data-real-ball]').setAttribute('cx', realX);
      root.querySelector('[data-model-path]').setAttribute('d', `M76 95H${modelX}`);
      root.querySelector('[data-real-path]').setAttribute('d', `M76 183H${realX}`);
      root.querySelector('[data-speed-value]').textContent = `${v.toFixed(1)} m/s`;
      root.querySelector('[data-friction-value]').textContent = mu.toFixed(2);
      const describe = d => d < 2.4 ? '未到目标区' : d > 3 ? '越过目标区' : '停在目标区';
      root.querySelector('.demo-result').textContent = `模型预测 ${prediction.toFixed(2)} m（${describe(prediction)}）；参考环境 ${reference.toFixed(2)} m（${describe(reference)}）。位置偏差 ${Math.abs(prediction - reference).toFixed(2)} m。`;
    }
    speed.addEventListener('input', draw);
    friction.addEventListener('input', draw);
    draw();
  });
})();
