const _cards = new Map(); // uid -> el
let _raf = null, _n = 0;

function _update() {
  const ch = window.innerHeight / 2;
  let best = null, minD = Infinity;
  for (const [uid, el] of _cards) {
    const r = el.getBoundingClientRect();
    const d = Math.abs(r.top + r.height / 2 - ch);
    if (d < minD) { minD = d; best = uid; }
  }
  for (const [uid, el] of _cards) {
    el.classList.toggle('hl-active', uid === best);
  }
}

function _onScroll() {
  if (_raf) return;
  _raf = requestAnimationFrame(() => { _raf = null; _update(); });
}

export function hlRegister(uid, el) {
  if (_n === 0) window.addEventListener('scroll', _onScroll, { passive: true });
  _n++;
  _cards.set(uid, el);
  _update();
}

export function hlUnregister(uid) {
  const el = _cards.get(uid);
  if (el) el.classList.remove('hl-active');
  _cards.delete(uid);
  _n--;
  if (_n === 0) window.removeEventListener('scroll', _onScroll);
}
