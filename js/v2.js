/* Web v2 · la batuta y el compás. Sin dependencias. */
(() => {
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const tramo = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const suave = t => 1 - Math.pow(1 - t, 3);
  if (quieto) document.documentElement.classList.add('quieta');

  /* ---------- Obertura: la batuta ---------- */
  const ob = document.querySelector('.obertura');
  const dirigido = ob.querySelector('.capa--dirigido');
  const batuta = ob.querySelector('.batuta');
  const mango = ob.querySelector('.mango');
  const pista = ob.querySelector('.pista');
  const titulares = ob.querySelectorAll('.titular');
  const vDir = ob.querySelector('.v-dirigido');
  const avance = ob.querySelector('.avance i');

  let W = ob.clientWidth, H = ob.clientHeight;
  let x = quieto ? .5 : .02, xMeta = quieto ? .5 : .02;
  let y = H * .6, yMeta = H * .6;
  let inclina = 0, ancho = 0, tocada = false;

  const medir = () => { W = ob.clientWidth; H = ob.clientHeight; if (!tocada) { y = yMeta = H * (W < 860 ? .5 : .6); } };
  addEventListener('resize', medir);
  medir();

  const apuntar = e => {
    const r = ob.getBoundingClientRect();
    xMeta = clamp((e.clientX - r.left) / r.width, .02, .98);
    yMeta = clamp(e.clientY - r.top, 40, r.height - 40);
    if (!tocada) { tocada = true; ob.classList.add('dirigida'); }
  };
  ob.addEventListener('pointermove', apuntar);
  ob.addEventListener('pointerdown', apuntar);
  mango.addEventListener('keydown', e => {
    const paso = e.key === 'ArrowLeft' ? -.05 : e.key === 'ArrowRight' ? .05 : e.key === 'Home' ? -1 : e.key === 'End' ? 1 : 0;
    if (!paso) return;
    e.preventDefault();
    xMeta = clamp(xMeta + paso, .02, .98);
    tocada = true; ob.classList.add('dirigida');
  });
  if (!quieto) setTimeout(() => { if (!tocada) xMeta = .42; }, 450);

  const tocar = v => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  if (!quieto) tocar(vDir);

  const pintarBatuta = () => {
    const antes = x;
    x += (xMeta - x) * (quieto ? 1 : .16);
    y += (yMeta - y) * (quieto ? 1 : .2);
    const vel = (x - antes) * W;
    inclina += (clamp(vel * 2.4, -80, 80) - inclina) * .18;
    const px = x * W;
    dirigido.style.clipPath = `polygon(0 0, ${(px + inclina).toFixed(1)}px 0, ${(px - inclina).toFixed(1)}px 100%, 0 100%)`;
    const ang = Math.atan(inclina / (H / 2)) * 180 / Math.PI;
    batuta.style.transform = `translateX(${px.toFixed(1)}px) rotate(${ang.toFixed(2)}deg)`;
    const mx = px + inclina * (1 - 2 * y / H);
    mango.style.transform = `translate(${mx.toFixed(1)}px, ${y.toFixed(1)}px)`;
    const aDerecha = mx < W - 190;
    pista.style.transform = `translate(${(aDerecha ? mx + 36 : mx - 176).toFixed(1)}px, ${(y - 15).toFixed(1)}px)`;

    const nuevo = Math.round((90 + 35 * x) * 2) / 2;
    if (nuevo !== ancho) {
      ancho = nuevo;
      titulares.forEach(t => { t.style.fontStretch = ancho + '%'; });
      mango.setAttribute('aria-valuenow', Math.round(x * 100));
    }

    const t = vDir.currentTime || 0;
    if (vDir.duration) avance.style.width = (t / vDir.duration * 100).toFixed(1) + '%';
  };

  /* ---------- Segundo momento: una orden, cuatro piezas ---------- */
  const compas = document.querySelector('.compas');
  const texto = compas.querySelector('.orden .texto');
  const ORDEN = compas.querySelector('.orden').getAttribute('aria-label');
  const marcaTempo = compas.querySelector('.marca-tempo');
  const numCompas = compas.querySelector('.num-compas');
  const hueco = compas.querySelector('.hueco');
  const piezas = [...compas.querySelectorAll('.pieza')].map(el => ({
    el, inicio: +el.dataset.inicio, giro: +el.dataset.giro, desde: +el.dataset.desde
  }));
  const carrusel = compas.querySelector('.pieza--carrusel');

  // la escena se toca sola al entrar en pantalla; «da capo» la repite
  const DURA = 6500;
  const daCapo = compas.querySelector('.dacapo');
  let p = quieto ? 1 : 0, letras = -1, compasN = -1, t0 = 0, tempo = '';

  piezas.forEach(({ el }) => el.addEventListener('click', () => {
    const ya = el.classList.contains('alzada');
    piezas.forEach(o => o.el.classList.remove('alzada'));
    if (!ya) el.classList.add('alzada');
  }));

  if (daCapo) daCapo.addEventListener('click', () => {
    piezas.forEach(o => o.el.classList.remove('alzada'));
    t0 = performance.now();
  });

  const pintarCompas = ahora => {
    const r = compas.getBoundingClientRect();
    const vh = innerHeight;
    if (r.bottom < 0 || r.top > vh) { if (p >= 1 || !t0) return; }
    if (!t0 && r.top < vh * .45 && r.bottom > vh * .55) t0 = ahora;
    p = quieto ? 1 : t0 ? clamp((ahora - t0) / DURA, 0, 1) : 0;

    const n = Math.round(tramo(p, .02, .22) * ORDEN.length);
    if (n !== letras) { letras = n; texto.textContent = ORDEN.slice(0, n); }
    const c = Math.round(p * 48);
    if (c !== compasN) { compasN = c; numCompas.textContent = c; }

    piezas.forEach(({ el, inicio, giro, desde }) => {
      const t = tramo(p, inicio, inicio + .16), e = suave(t);
      el.style.setProperty('--ty', ((1 - e) * -vh * .95).toFixed(1) + 'px');
      el.style.setProperty('--rot', (giro + (1 - e) * desde).toFixed(2) + 'deg');
      el.style.setProperty('--op', Math.min(1, t * 5).toFixed(2));
      el.tabIndex = t > .9 ? 0 : -1;
    });
    carrusel.style.setProperty('--abre', suave(tramo(p, .68, .8)).toFixed(3));
    hueco.style.setProperty('--op', tramo(p, .9, .97).toFixed(2));

    const nombre = quieto || p <= 0 || p >= 1 ? 'Fermata' : p < .25 ? 'Andante' : 'Allegro';
    if (nombre !== tempo) { tempo = nombre; marcaTempo.textContent = nombre; }
  };

  const bucle = ahora => {
    if (ob.getBoundingClientRect().bottom > 0) pintarBatuta();
    pintarCompas(ahora);
    if (!quieto) requestAnimationFrame(bucle);
  };
  requestAnimationFrame(bucle);
  if (quieto) addEventListener('resize', () => requestAnimationFrame(bucle));
})();
