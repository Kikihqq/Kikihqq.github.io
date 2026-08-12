// ==========================================================
// Huiqing Zhang — small front-end interactions
// ==========================================================

// Smooth-scroll offset so anchor links don't slide under the sticky nav.
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function (e) {
    const id = this.getAttribute('href');
    if (id.length <= 1) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const navH = document.querySelector('.nav')?.offsetHeight || 0;
    const top  = target.getBoundingClientRect().top + window.scrollY - navH - 12;
    window.scrollTo({ top, behavior: 'smooth' });
    history.replaceState(null, '', id);
  });
});

// Highlight current section in the nav
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navLinks.forEach(l => {
        l.classList.toggle('active', l.getAttribute('href') === '#' + id);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => observer.observe(s));

// ==========================================================
// Photo gallery lightbox — click the stacked photo to open a
// swipeable, keyboard- and click-navigable gallery.
// ==========================================================
(function () {
  const stack = document.getElementById('photoStack');
  const lightbox = document.getElementById('lightbox');
  if (!stack || !lightbox) return;

  const images = stack.dataset.gallery.split(',').map(s => s.trim()).filter(Boolean);
  const img = document.getElementById('lightboxImg');
  const dotsWrap = document.getElementById('lightboxDots');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');
  let index = 0;

  images.forEach(() => {
    const dot = document.createElement('span');
    dotsWrap.appendChild(dot);
  });

  function render() {
    img.src = images[index];
    [...dotsWrap.children].forEach((d, i) => d.classList.toggle('active', i === index));
  }
  function show(i) {
    index = (i + images.length) % images.length;
    render();
  }
  function open() {
    show(0);
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function close() {
    lightbox.hidden = true;
    document.body.style.overflow = '';
  }

  stack.addEventListener('click', open);
  prevBtn.addEventListener('click', () => show(index - 1));
  nextBtn.addEventListener('click', () => show(index + 1));
  lightbox.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));

  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });

  // swipe support
  let touchStartX = null;
  lightbox.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    touchStartX = null;
  }, { passive: true });
})();

// ==========================================================
// Research interest chips — click to open a detail modal.
// ==========================================================
(function () {
  const modal = document.getElementById('interestModal');
  if (!modal) return;

  const titleEl = document.getElementById('interestModalTitle');
  const bodyEl = document.getElementById('interestModalBody');

  function open(title, desc) {
    titleEl.textContent = title;
    bodyEl.textContent = desc;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function close() {
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => open(chip.dataset.title, chip.dataset.desc));
  });
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (!modal.hidden && e.key === 'Escape') close();
  });
})();
