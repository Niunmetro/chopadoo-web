/* Chopadoo · barra, menú y animaciones de las secciones. Sin dependencias. */
(() => {
  const raiz = document.documentElement;
  const quieto = raiz.classList.contains('quieta');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const $ = (s, d = document) => d.querySelector(s);
  const $$ = (s, d = document) => [...d.querySelectorAll(s)];
  if (!quieto) raiz.classList.add('anima');

  /* ---------- Menú ---------- */
  const barra = $('.barra');
  const indice = $('#indice');
  $$('li', indice).forEach((li, i) => li.style.setProperty('--i', i));
  $('.barra__menu').addEventListener('click', () => indice.showModal());
  $$('a', indice).forEach(a => a.addEventListener('click', () => indice.close()));

  /* ---------- Entradas al llegar ---------- */
  const escalonar = sel => $$(sel).forEach(el => {
    el.classList.add('entra');
    el.style.setProperty('--i', [...el.parentNode.children].indexOf(el));
  });
  escalonar('.sec h2, .sec__texto, .tres li, .reparto > div, .indice-curso li, .club__partes li, .precio__lista li, .faq details, .mm, .reel, .web, .tarifa');
  $$('.calendario li').forEach((li, i) => li.style.setProperty('--i', i));

  const contar = el => {
    const hasta = +el.dataset.hasta, t0 = performance.now();
    const paso = ahora => {
      const t = clamp((ahora - t0) / 1100, 0, 1);
      el.textContent = Math.round(hasta * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  };

  const vistas = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('visto');
    vistas.unobserve(e.target);
    const cifra = $('.cifra', e.target);
    if (cifra && !quieto) contar(cifra);
  }), { rootMargin: '0px 0px -22% 0px' });
  $$('.sec, .como, .suite, .fermata').forEach(s => vistas.observe(s));

  /* ---------- Cómo funciona: el roll ---------- */
  const como = $('.como'), rollo = $('.como__rollo'), pasos = $$('.paso'), comoNum = $('.como__num');
  const ancho = matchMedia('(min-width: 861px)');
  let pasoActivo = -1;
  const pintarComo = () => {
    if (quieto || !ancho.matches) { rollo.style.removeProperty('--x'); return; }
    const r = como.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = clamp(-r.top / (r.height - innerHeight), 0, 1);
    rollo.style.setProperty('--x', (-p * (rollo.scrollWidth - innerWidth)).toFixed(1) + 'px');
    const n = Math.round(p * (pasos.length - 1));
    if (n !== pasoActivo) {
      pasoActivo = n;
      pasos.forEach((el, i) => el.classList.toggle('activo', i === n));
      comoNum.textContent = `compás ${n + 1} de ${pasos.length}`;
    }
  };

  /* ---------- Barra: estado, avance y compás ---------- */
  const obertura = $('.obertura');
  const secciones = $$('main > section[id]');
  const nav = $('.barra__nav'), enlaces = $$('.barra__nav a');
  const compasN = $('.barra__compas i');
  let actual = '';
  const pintarBarra = () => {
    barra.dataset.estado = obertura.getBoundingClientRect().bottom <= 60 ? 'dentro' : 'portada';
    const total = raiz.scrollHeight - innerHeight;
    barra.style.setProperty('--avance', total > 0 ? (scrollY / total).toFixed(4) : 0);
    let n = 0, id = '';
    secciones.forEach((s, i) => { if (s.getBoundingClientRect().top <= innerHeight * .4) { n = i; id = s.id; } });
    if (id !== actual) {
      actual = id;
      compasN.textContent = n + 1;
      enlaces.forEach(a => a.classList.toggle('aqui', a.getAttribute('href') === '#' + id));
      /* en pantallas estrechas la tira de secciones sigue a la que toca */
      const aqui = enlaces.find(a => a.classList.contains('aqui'));
      if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: aqui ? aqui.offsetLeft - nav.clientWidth / 2 + aqui.offsetWidth / 2 : 0, behavior: quieto ? 'auto' : 'smooth' });
    }
  };

  let pendiente = false;
  const alMover = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; pintarBarra(); pintarComo(); pintarPentasScroll(); });
  };
  addEventListener('scroll', alMover, { passive: true });
  addEventListener('resize', alMover);

  /* ---------- Tu marca: repintar desde donde se toca ---------- */
  const caja = $('.muestra-marca'), mandos = $('.mandos');
  const nombres = $$('.mm-nombre');
  let punto = null;
  mandos.addEventListener('submit', e => e.preventDefault());
  mandos.addEventListener('pointerdown', e => { punto = { x: e.clientX, y: e.clientY }; });
  mandos.nombre.addEventListener('input', () => {
    const v = mandos.nombre.value.trim() || 'Tu negocio';
    nombres.forEach(n => { n.textContent = v; });
  });
  $$('input[name="color"]', mandos).forEach(radio => radio.addEventListener('change', () => {
    const pintar = () => caja.style.setProperty('--marca', radio.value);
    if (quieto || !document.startViewTransition) { pintar(); return; }
    const r = caja.getBoundingClientRect();
    const x = punto ? clamp(punto.x - r.left, 0, r.width) : r.width / 2;
    const y = punto ? clamp(punto.y - r.top, 0, r.height) : r.height / 2;
    const radio2 = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
    document.startViewTransition(pintar).ready.then(() => {
      raiz.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radio2}px at ${x}px ${y}px)`] },
        { duration: 750, easing: 'cubic-bezier(.16,1,.3,1)', pseudoElement: '::view-transition-new(piezas)' }
      );
    }).catch(() => {});
  }));

  /* ---------- Muestras: bucle mudo a la vista, reel entero al tocar ---------- */
  const disco = $('.disco'), reels = $$('.reel');
  const ruta = (reel, entero) => `media/muestras/${reel.dataset.clave}${entero ? '' : '_bucle'}.mp4`;
  const tocar = v => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  const aBucle = reel => {
    const v = $('video', reel);
    reel.classList.remove('suena');
    $('button span', reel).textContent = 'con sonido';
    v.pause(); v.controls = false; v.muted = true; v.loop = true;
    v.src = ruta(reel, false);
    if (reel.dataset.vista && !quieto) tocar(v);
  };
  const aEntero = reel => {
    reels.forEach(o => { if (o !== reel && o.classList.contains('suena')) aBucle(o); });
    const v = $('video', reel);
    reel.classList.add('suena');
    $('button span', reel).textContent = 'parar';
    v.loop = false; v.muted = false; v.controls = true;
    v.src = ruta(reel, true);
    tocar(v);
  };
  const ojo = new IntersectionObserver(es => es.forEach(e => {
    const reel = e.target, v = $('video', reel);
    if (e.isIntersecting) {
      reel.dataset.vista = '1';
      if (quieto || reel.classList.contains('suena')) return;
      if (!v.getAttribute('src')) v.src = ruta(reel, false);
      tocar(v);
    } else {
      delete reel.dataset.vista;
      if (reel.classList.contains('suena')) aBucle(reel); else v.pause();
    }
  }), { threshold: .6 });
  reels.forEach(reel => {
    ojo.observe(reel);
    $('button', reel).addEventListener('click', () => reel.classList.contains('suena') ? aBucle(reel) : aEntero(reel));
    $('video', reel).addEventListener('ended', () => { if (reel.classList.contains('suena')) aBucle(reel); });
  });
  $$('.flecha').forEach(b => b.addEventListener('click', () => {
    const paso = reels[1].offsetLeft - reels[0].offsetLeft;
    disco.scrollBy({ left: +b.dataset.dir * paso * 2, behavior: quieto ? 'auto' : 'smooth' });
  }));

  /* ---------- Tú diriges: dos pentagramas ---------- */
  const pentas = $('.pentas'), svg = $('.pentas__svg');
  const NS = 'http://www.w3.org/2000/svg';
  const crea = (tipo, attrs, padre = svg) => {
    const el = document.createElementNS(NS, tipo);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    padre.appendChild(el);
    return el;
  };
  [44, 194].forEach(y0 => { for (let i = 0; i < 5; i++) crea('line', { x1: 0, x2: 1200, y1: y0 + i * 12, y2: y0 + i * 12 }); });
  crea('text', { x: 0, y: 28 }).textContent = 'tú';
  crea('text', { x: 0, y: 178 }).textContent = 'la IA';
  const TU = [[150, 80], [390, 56], [630, 68], [850, 44], [1070, 62]];
  TU.forEach(([x, y]) => {
    crea('ellipse', { class: 'tu', cx: x, cy: y, rx: 14, ry: 10, transform: `rotate(-20 ${x} ${y})` });
    crea('rect', { class: 'tu', x: x + 11, y: y - 58, width: 3, height: 56, rx: 1.5 });
  });
  const melodia = x => {
    if (x <= TU[0][0]) return TU[0][1];
    for (let i = 1; i < TU.length; i++) if (x <= TU[i][0]) {
      const [x0, y0] = TU[i - 1], [x1, y1] = TU[i];
      return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    }
    return TU[TU.length - 1][1];
  };
  const IA = [];
  for (let i = 0; i < 28; i++) {
    const x = 46 + i * 41, base = 218 + Math.round(Math.sin(i * 1.9) * 3) * 6;
    const g = crea('g', {});
    crea('ellipse', { class: 'ia', cx: x, cy: base, rx: 6.5, ry: 4.6, transform: `rotate(-20 ${x} ${base})` }, g);
    crea('rect', { class: 'ia', x: x + 5, y: base - 30, width: 1.6, height: 29 }, g);
    IA.push({ g, x, sigue: (melodia(x) - 68) * 1.1 - (base - 218) });
  }
  let batuta = quieto ? 600 : -300, batutaMeta = batuta, encima = false, penta = false;
  const pintarPentas = () => {
    batuta += (batutaMeta - batuta) * (quieto ? 1 : .12);
    IA.forEach(n => {
      const k = Math.exp(-Math.pow((n.x - batuta) / 190, 2));
      n.g.setAttribute('transform', `translate(0 ${(n.sigue * k).toFixed(2)})`);
    });
    if (!quieto && Math.abs(batutaMeta - batuta) > .5) requestAnimationFrame(pintarPentas);
    else penta = false;
  };
  const moverBatuta = x => {
    batutaMeta = x;
    if (!penta) { penta = true; requestAnimationFrame(pintarPentas); }
  };
  pentas.addEventListener('pointermove', e => {
    const r = svg.getBoundingClientRect();
    encima = e.pointerType === 'mouse';
    moverBatuta((e.clientX - r.left) / r.width * 1200);
  });
  pentas.addEventListener('pointerleave', () => { encima = false; });
  const pintarPentasScroll = () => {
    if (encima || quieto) return;
    const r = pentas.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    moverBatuta(clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1) * 1500 - 150);
  };

  /* ---------- WhatsApp: el dicho se recoge al empezar a bajar ---------- */
  const wa = $('.wa');
  if (wa) {
    const recoger = () => { if (scrollY > innerHeight * .6) { wa.dataset.dicho = 'no'; removeEventListener('scroll', recoger); } };
    addEventListener('scroll', recoger, { passive: true });
    recoger();
  }

  /* ---------- Movimiento: se puede parar ---------- */
  const mov = $('.pie__mov');
  if (mov) {
    mov.textContent = quieto ? 'Activar el movimiento' : 'Parar el movimiento';
    mov.addEventListener('click', () => {
      try { localStorage.setItem('chopadoo-quieta', quieto ? '0' : '1'); } catch (e) {}
      location.reload();
    });
  }

  pintarBarra(); pintarComo(); pintarPentas(); pintarPentasScroll();
})();
