(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
  // Keep the mobile call action out of the hero, which already has its own CTA.
  const stickyCall = document.querySelector('.sticky-call');
  const offerSection = document.getElementById('ponuda');
  if (stickyCall && offerSection) {
    let callUpdate = 0;
    const updateCall = () => {
      callUpdate = 0;
      const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
      const visible = offerSection.getBoundingClientRect().top <= headerHeight + 17;
      const menuTop = document.getElementById('meni')?.getBoundingClientRect().top ?? Infinity;
      document.querySelector('.site-canvas-layer')?.classList.toggle('is-shaded', menuTop <= headerHeight + 17);
      stickyCall.classList.toggle('is-visible', visible);
      stickyCall.inert = !visible;
      stickyCall.setAttribute('aria-hidden', String(!visible));
    };
    const scheduleCall = () => {
      if (!callUpdate) callUpdate = requestAnimationFrame(updateCall);
    };
    window.addEventListener('scroll', scheduleCall, { passive: true });
    window.addEventListener('resize', scheduleCall, { passive: true });
    window.addEventListener('pageshow', scheduleCall);
    new ResizeObserver(scheduleCall).observe(document.querySelector('.hero'));
    updateCall();
  }

  const canvas = document.getElementById('heroCanvas');
  const finishSection = document.getElementById('ponuda');
  if (!canvas || !finishSection) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches) return;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  const count = 160;
  const blobs = new Map();
  const bitmaps = new Map();
  const fetching = new Set();
  const decoding = new Set();
  const failed = new Set();
  const decodeFailed = new Set();
  const clamp = (n, a, b) => Math.min(Math.max(n, a), b);
  let target = 0, current = 0, lastDrawn = -1;
  let raf = 0, previousTime = 0, finishScroll = 1;
  let width = 1, height = 1;

  function schedule() {
    if (!raf && !document.hidden) raf = requestAnimationFrame(render);
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    // Source frames are 1280x720: avoid oversized high-DPI canvas buffers.
    const scale = Math.min(window.devicePixelRatio || 1, 1.5, 1920 / width);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const header = document.querySelector('.site-header').offsetHeight;
    finishScroll = Math.max(1, finishSection.getBoundingClientRect().top + window.scrollY - header);
    lastDrawn = -1;
    schedule();
  }

  function priorities() {
    const wanted = Math.round(target);
    const visible = Math.round(current);
    const order = [visible, wanted, 0, count - 1];
    for (let d = 1; d <= 12; d++) order.push(visible + d, visible - d, wanted + d, wanted - d);
    // Early overview frames help fast jumps before the full sequence arrives.
    for (let i = 0; i < count; i += 8) order.push(i);
    for (let i = 0; i < count; i++) order.push(i);
    return [...new Set(order)].filter(i => i >= 0 && i < count);
  }

  function loadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Frame unavailable'));
      image.src = source;
    });
  }

  async function decodeSource(source) {
    // Local files cannot be fetched as blobs; ordinary images work on file:// too.
    if (typeof source === 'string') return loadImage(source);
    if (window.createImageBitmap) {
      try { return await createImageBitmap(source); } catch { /* Use the image decoder below. */ }
    }
    const url = URL.createObjectURL(source);
    try { return await loadImage(url); }
    finally { URL.revokeObjectURL(url); }
  }

  function fetchFrames() {
    if (document.hidden) return;
    for (const index of priorities()) {
      if (fetching.size >= 4) break;
      if (blobs.has(index) || fetching.has(index) || failed.has(index)) continue;
      fetching.add(index);
      const url = `assets/frames-webp/frame-${String(index + 1).padStart(3, '0')}.webp`;
      const source = location.protocol === 'file:'
        ? Promise.resolve(url)
        : fetch(url).then(response => {
            if (!response.ok) throw new Error('Frame unavailable');
            return response.blob();
          });
      source
        .then(blob => blobs.set(index, blob))
        .catch(() => failed.add(index))
        .finally(() => {
          fetching.delete(index);
          schedule();
          fetchFrames();
        });
    }
  }

  function decodeFrames() {
    const wanted = Math.round(current);
    const available = [...blobs.keys()].sort((a, b) => Math.abs(a - wanted) - Math.abs(b - wanted));
    const nearby = [wanted, Math.round(target), wanted + 1, wanted - 1, wanted + 2, wanted - 2];
    // Decode only useful frames; keep compressed blobs for inexpensive reverse scrolling.
    const candidates = [...new Set([...nearby, ...available.slice(0, 2)])];
    for (const index of candidates) {
      if (decoding.size >= 2) break;
      if (!blobs.has(index) || bitmaps.has(index) || decoding.has(index) || decodeFailed.has(index)) continue;
      decoding.add(index);
      decodeSource(blobs.get(index))
        .then(bitmap => {
          bitmaps.set(index, bitmap);
          while (bitmaps.size > 24) {
            const oldest = bitmaps.keys().next().value;
            bitmaps.get(oldest).close?.();
            bitmaps.delete(oldest);
          }
        })
        .catch(() => decodeFailed.add(index))
        .finally(() => { decoding.delete(index); schedule(); });
    }
  }

  function draw() {
    // Keep the exact displayed frame if a background decode evicts its cache entry.
    if (lastDrawn === Math.round(current)) return;
    let nearest = -1;
    for (const index of bitmaps.keys()) {
      if (nearest < 0 || Math.abs(index - current) < Math.abs(nearest - current)) nearest = index;
    }
    if (nearest < 0 || nearest === lastDrawn) return;
    const bitmap = bitmaps.get(nearest);
    const scale = Math.max(width / bitmap.width, height / bitmap.height);
    const w = bitmap.width * scale, h = bitmap.height * scale;
    ctx.drawImage(bitmap, (width - w) / 2, (height - h) / 2, w, h);
    canvas.classList.add('is-ready');
    canvas.dataset.frame = String(nearest + 1);
    lastDrawn = nearest;
    // Refresh the displayed frame's position in the LRU cache.
    bitmaps.delete(nearest);
    bitmaps.set(nearest, bitmap);
  }

  function render(time) {
    raf = 0;
    target = clamp(window.scrollY / finishScroll, 0, 1) * (count - 1);
    const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16.67;
    previousTime = time;
    // Time-based easing behaves consistently on 60Hz and 120Hz displays.
    current += (target - current) * (1 - Math.exp(-elapsed / 65));
    if (Math.abs(target - current) < 0.05) current = target;
    fetchFrames();
    decodeFrames();
    draw();
    if (current !== target) schedule();
    else previousTime = 0;
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  new ResizeObserver(resize).observe(document.querySelector('.hero'));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; previousTime = 0; }
    else schedule();
  });
  resize();
})();


