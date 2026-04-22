const _cards = new Map();
let _raf = null, _n = 0;

function _update() {
  const cy = window.scrollY + window.innerHeight / 2;
  let best = null, minD = Infinity;
  for (const [uid, { el }] of _cards) {
    const r = el.getBoundingClientRect();
    const d = Math.abs(window.scrollY + r.top + r.height / 2 - cy);
    if (d < minD) { minD = d; best = uid; }
  }
  for (const [uid, { set }] of _cards) set(uid === best);
}

function _onScroll() {
  if (_raf) return;
  _raf = requestAnimationFrame(() => { _raf = null; _update(); });
}

export function hlRegister(uid, el, setActive) {
  if (_n === 0) window.addEventListener('scroll', _onScroll, { passive: true });
  _n++;
  _cards.set(uid, { el, set: setActive });
  _update();
}

export function hlUnregister(uid) {
  _cards.delete(uid);
  _n--;
  if (_n === 0) window.removeEventListener('scroll', _onScroll);
}
