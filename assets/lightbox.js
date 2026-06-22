// Very small lightbox script (vanilla JS)
const createModal = () => {
  const modal = document.createElement('div');
  modal.style = `
    position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
    background:rgba(0,0,0,0.8); z-index:9999; padding:20px;
  `;
  modal.innerHTML = `
    <div style="max-width:90%; max-height:90%; position:relative; color:#fff;">
      <img id="lb-img" style="max-width:100%; max-height:80vh; display:block; margin:0 auto; border-radius:6px;" />
      <div id="lb-meta" style="margin-top:8px; text-align:center;"></div>
      <button id="lb-close" style="position:absolute; right:0; top:-40px; background:none; border:none; color:#fff; font-size:28px; cursor:pointer;">&times;</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#lb-close').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  return modal;
};

document.addEventListener('click', (e) => {
  const t = e.target.closest && e.target.closest('img[data-full]');
  if (!t) return;
  const modal = createModal();
  const img = modal.querySelector('#lb-img');
  const meta = modal.querySelector('#lb-meta');
  img.src = t.dataset.full;
  meta.innerHTML = `<strong>${t.dataset.title || ''}</strong><div style="font-size:0.9em; opacity:0.9">${t.dataset.date || ''}</div>`;
});
