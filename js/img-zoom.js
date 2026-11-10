/* ===========================================================
 * img-zoom.js
 * ===========================================================
 * click an image in post to view it fullscreen.
 * ========================================================== */

(function () {
  var imgs = document.querySelectorAll('.post-container img');
  var overlay = null;

  function close() {
    if (!overlay) return;
    var el = overlay;
    overlay = null;
    el.classList.remove('show');
    setTimeout(function () { el.parentNode && el.parentNode.removeChild(el); }, 200);
  }

  function open(src, alt) {
    overlay = document.createElement('div');
    overlay.className = 'img-zoom-overlay';
    var img = document.createElement('img');
    img.src = src;
    img.alt = alt || '';
    overlay.appendChild(img);
    overlay.addEventListener('click', close);
    document.body.appendChild(overlay);
    // force reflow so the opacity transition runs
    overlay.offsetWidth;
    overlay.classList.add('show');
  }

  Array.prototype.forEach.call(imgs, function (img) {
    // keep linked images working as links
    if (img.closest && img.closest('a')) return;
    img.classList.add('img-zoomable');
    img.addEventListener('click', function () { open(img.currentSrc || img.src, img.alt); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
  window.addEventListener('scroll', close, { passive: true });
})();
