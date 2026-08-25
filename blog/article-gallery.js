(function () {
  const slides = [...document.querySelectorAll('.gallery-slide')];
  const lightbox = document.getElementById('articleLightbox');
  const image = document.getElementById('articleLightboxImage');
  const count = document.getElementById('articleLightboxCount');
  if (!slides.length || !lightbox || !image) return;
  let index = 0;
  let touchStartX = null;

  function show(next) {
    index = (next + slides.length) % slides.length;
    const source = slides[index].querySelector('img');
    image.src = source.src;
    image.alt = source.alt;
    count.textContent = `${index + 1} / ${slides.length}`;
  }
  function open(next) {
    show(next);
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    lightbox.querySelector('[data-close]').focus();
  }
  function close() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
    slides[index].focus();
  }

  slides.forEach((slide, i) => slide.addEventListener('click', () => open(i)));
  lightbox.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', close));
  lightbox.querySelector('[data-prev]').addEventListener('click', () => show(index - 1));
  lightbox.querySelector('[data-next]').addEventListener('click', () => show(index + 1));
  document.addEventListener('keydown', event => {
    if (lightbox.hidden) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') show(index - 1);
    if (event.key === 'ArrowRight') show(index + 1);
  });
  lightbox.addEventListener('touchstart', event => { touchStartX = event.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', event => {
    if (touchStartX === null) return;
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 45) show(index + (delta < 0 ? 1 : -1));
    touchStartX = null;
  }, { passive: true });
})();
