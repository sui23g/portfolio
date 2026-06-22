// public/assets/lightbox.js
// Non-looping lightbox that HIDES prev/next buttons at ends.
// Works with your existing template (class="thumb" inside .gallery).
(function () {
  const thumbs = Array.from(document.querySelectorAll('.gallery .thumb'));
  if (!thumbs.length) return;

  // Inject minimal CSS
  const style = document.createElement('style');
  style.textContent = `
.lb-overlay{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(10,10,10,.85);z-index:1200}
.lb-overlay.open{display:flex}
.lb-content{position:relative;max-width:95%;max-height:95%;display:flex;flex-direction:column;align-items:center;justify-content:center}
.lb-img{max-width:100%;max-height:80vh;border-radius:6px;box-shadow:0 10px 30px rgba(0,0,0,.6);user-select:none;-webkit-user-drag:none}
.lb-caption{margin-top:10px;color:#fff;font-size:0.95rem;opacity:.95;text-align:center}
.lb-btn{position:absolute;top:50%;transform:translateY(-50%);background:rgba(0,0,0,.45);border:0;color:#fff;padding:12px;border-radius:999px;cursor:pointer;backdrop-filter:blur(2px);transition:opacity .12s}
.lb-prev{left:10px}.lb-next{right:10px}
.lb-close{position:absolute;right:14px;top:14px;background:rgba(255,255,255,0.08);border:0;color:#fff;padding:8px;border-radius:6px;cursor:pointer}
@media(max-width:600px){.lb-img{max-height:70vh}.lb-btn{padding:10px}.lb-prev{left:6px}.lb-next{right:6px}}`;
  document.head.appendChild(style);

  // Create DOM
  const overlay = document.createElement('div');
  overlay.className = 'lb-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-hidden', 'true');

  const content = document.createElement('div');
  content.className = 'lb-content';

  const img = document.createElement('img');
  img.className = 'lb-img';
  img.alt = '';

  const caption = document.createElement('div');
  caption.className = 'lb-caption';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'lb-btn lb-prev';
  prevBtn.innerHTML = '&#9664;';
  prevBtn.setAttribute('aria-label', 'Previous image');

  const nextBtn = document.createElement('button');
  nextBtn.className = 'lb-btn lb-next';
  nextBtn.innerHTML = '&#9654;';
  nextBtn.setAttribute('aria-label', 'Next image');

  const closeBtn = document.createElement('button');
  closeBtn.className = 'lb-close';
  closeBtn.innerHTML = '&#10005;';
  closeBtn.setAttribute('aria-label', 'Close');

  content.appendChild(img);
  content.appendChild(caption);
  overlay.appendChild(content);
  overlay.appendChild(prevBtn);
  overlay.appendChild(nextBtn);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);

  let current = -1;
  let touchStartX = 0, touchEndX = 0;
  let mouseDownX = null;

  function setCaption(el) {
    const title = el.dataset.title || el.alt || '';
    const date = el.dataset.date || '';
    caption.textContent = title + (date ? ` — ${date}` : '');
  }

  function preload(i) {
    if (i < 0 || i >= thumbs.length) return;
    const u = thumbs[i].dataset.full || thumbs[i].src;
    const p = new Image(); p.src = u;
  }

  function updateButtons() {
    // Hide prev at first, hide next at last (use display to remove from layout)
    if (!prevBtn || !nextBtn) return;
    if (current <= 0) {
      prevBtn.style.display = 'none';
      prevBtn.setAttribute('aria-hidden', 'true');
    } else {
      prevBtn.style.display = '';
      prevBtn.setAttribute('aria-hidden', 'false');
    }
    if (current >= thumbs.length - 1) {
      nextBtn.style.display = 'none';
      nextBtn.setAttribute('aria-hidden', 'true');
    } else {
      nextBtn.style.display = '';
      nextBtn.setAttribute('aria-hidden', 'false');
    }
  }

  function open(idx) {
    current = idx;
    const el = thumbs[idx];
    img.src = el.dataset.full || el.src;
    img.alt = el.alt || '';
    setCaption(el);
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    preload(current - 1); preload(current + 1);
    updateButtons();
    closeBtn.focus();
  }

  function close() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    img.src = '';
    current = -1;
    document.body.style.overflow = '';
  }

  function show(i) {
    // clamp to bounds and do nothing if same index
    i = Math.max(0, Math.min(thumbs.length - 1, i));
    if (i === current) return;
    current = i;
    const el = thumbs[i];
    img.src = el.dataset.full || el.src;
    img.alt = el.alt || '';
    setCaption(el);
    preload(i - 1); preload(i + 1);
    updateButtons();
  }

  function next() {
    if (current >= thumbs.length - 1) return; // do not loop or move past end
    show(current + 1);
  }
  function prev() {
    if (current <= 0) return; // do not loop or move before start
    show(current - 1);
  }

  // Bind events on thumbnails (no template change)
  thumbs.forEach((t, idx) => {
    t.tabIndex = t.tabIndex || 0;
    t.addEventListener('click', (e) => { e.preventDefault(); open(idx); });
    t.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(idx); } });
  });

  // Controls
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  closeBtn.addEventListener('click', close);

  // Close when clicking backdrop (but not when clicking the image)
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // Keyboard
  window.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'ArrowRight') { if (nextBtn.style.display !== 'none') next(); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { if (prevBtn.style.display !== 'none') prev(); e.preventDefault(); }
    if (e.key === 'Escape') { close(); e.preventDefault(); }
  });

  // Touch swipe on img (respect ends)
  img.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  img.addEventListener('touchmove', (e) => { touchEndX = e.touches[0].clientX; }, { passive: true });
  img.addEventListener('touchend', () => {
    const dx = touchEndX - touchStartX;
    const thr = 40;
    if (Math.abs(dx) > thr) {
      if (dx < 0) { if (nextBtn.style.display !== 'none') next(); }
      else { if (prevBtn.style.display !== 'none') prev(); }
    }
    touchStartX = touchEndX = 0;
  });

  // Mouse drag support (desktop) - respect ends
  img.addEventListener('mousedown', (e) => { mouseDownX = e.clientX; e.preventDefault(); });
  window.addEventListener('mouseup', (e) => {
    if (mouseDownX !== null) {
      const dx = e.clientX - mouseDownX;
      const thr = 60;
      if (Math.abs(dx) > thr) {
        if (dx < 0) { if (nextBtn.style.display !== 'none') next(); }
        else { if (prevBtn.style.display !== 'none') prev(); }
      }
    }
    mouseDownX = null;
  });

  // Prevent image drag ghost
  img.addEventListener('dragstart', (e) => e.preventDefault());

  // If there is only one image, hide both buttons
  if (thumbs.length <= 1) {
    current = 0;
    updateButtons();
  }

})();