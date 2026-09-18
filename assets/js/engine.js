// engine.js — renders an interactive spec into the DOM.
// Types: simulation (projectile | numberline | area), quiz, fillblank, matching.
(function () {
  const L = (o) => I18n.localize(o);
  const T = (k) => I18n.t(k);

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  // Parse a number, accepting decimals, fractions "a/b", and mixed "a b/c".
  function parseNum(raw) {
    const s = String(raw == null ? '' : raw).trim();
    if (!s) return NaN;
    let m = s.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (m) {
      const w = Number(m[1]), num = Number(m[2]), den = Number(m[3]);
      if (!den) return NaN;
      const frac = num / den;
      return w < 0 ? w - frac : w + frac;
    }
    m = s.match(/^(-?\d+)\s*\/\s*(\d+)$/);
    if (m) { const den = Number(m[2]); return den ? Number(m[1]) / den : NaN; }
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function typeLabel(spec) {
    if (spec.type === 'simulation') return spec.levels[0]?.config?.kind || 'simulation';
    return spec.type;
  }

  function buildHeader(spec) {
    const h = el('div', 'inter-header');
    h.appendChild(el('h2', 'inter-title', L(spec.title)));
    const meta = el('div', 'inter-meta');
    if (spec.subject) meta.appendChild(el('span', 'badge', L(spec.subject)));
    meta.appendChild(el('span', 'badge ghost', T('card.type') + ': ' + typeLabel(spec)));
    h.appendChild(meta);
    return h;
  }

  function panel(titleKey, text, cls) {
    const p = el('div', 'panel' + (cls ? ' ' + cls : ''));
    p.appendChild(el('h3', 'panel-title', T(titleKey)));
    p.appendChild(el('p', 'panel-text', text));
    return p;
  }

  function renderInteractive(root, spec) {
    root.innerHTML = '';
    root.appendChild(buildHeader(spec));
    if (spec.intro) root.appendChild(panel('player.intro', L(spec.intro)));
    if (spec.toolbox) root.appendChild(panel('player.toolbox', L(spec.toolbox), 'toolbox'));

    const tabs = el('div', 'level-tabs');
    const body = el('div', 'level-body');
    let current = 0;
    const tabEls = spec.levels.map((_, i) => {
      const b = el('button', 'level-tab', `${T('player.level')} ${i + 1}`);
      b.addEventListener('click', () => { current = i; paint(); renderLevel(body, spec, i); });
      tabs.appendChild(b);
      return b;
    });
    function paint() { tabEls.forEach((b, i) => b.classList.toggle('active', i === current)); }

    root.appendChild(tabs);
    root.appendChild(body);
    paint();
    renderLevel(body, spec, 0);
  }

  function renderLevel(body, spec, idx) {
    body.innerHTML = '';
    const level = spec.levels[idx];

    body.appendChild(el('p', 'level-prompt', L(level.prompt)));

    const widget = buildWidget(spec, level);
    body.appendChild(widget.node);

    // Tiered hints
    const hintsWrap = el('div', 'hints');
    const hintsHead = el('div', 'hints-head');
    let shown = 0;
    const hintBtn = el('button', 'btn btn-hint', T('player.showHint'));
    const hintList = el('ol', 'hint-list');
    hintBtn.addEventListener('click', () => {
      if (shown < level.hints.length) {
        const li = el('li', 'hint-item');
        li.appendChild(el('span', 'hint-tag', `${T('player.hint')} ${shown + 1}`));
        li.appendChild(el('span', 'hint-text', L(level.hints[shown])));
        hintList.appendChild(li);
        shown++;
        hintBtn.disabled = shown >= level.hints.length;
        if (hintBtn.disabled) hintBtn.textContent = T('player.hint') + ' ✓';
      }
    });
    hintsHead.appendChild(hintBtn);
    hintsWrap.appendChild(hintsHead);
    hintsWrap.appendChild(hintList);
    body.appendChild(hintsWrap);

    // Controls
    const feedback = el('div', 'feedback');
    const solutionBox = el('div', 'solution hidden');
    solutionBox.appendChild(el('h4', 'solution-title', T('player.solution')));
    solutionBox.appendChild(el('p', 'solution-text', L(level.solution)));

    const controls = el('div', 'controls');
    const checkBtn = el('button', 'btn btn-primary', T('player.check'));
    const solBtn = el('button', 'btn', T('player.showSolution'));
    const resetBtn = el('button', 'btn btn-ghost', T('player.reset'));

    checkBtn.addEventListener('click', () => {
      const res = widget.check();
      feedback.className = 'feedback ' + (res.ok ? 'ok' : 'bad');
      feedback.textContent = res.ok ? T('player.correct') : (res.message || T('player.wrong'));
      if (res.ok) solutionBox.classList.remove('hidden');
    });
    solBtn.addEventListener('click', () => solutionBox.classList.toggle('hidden'));
    resetBtn.addEventListener('click', () => renderLevel(body, spec, idx));

    controls.appendChild(checkBtn);
    controls.appendChild(solBtn);
    controls.appendChild(resetBtn);
    body.appendChild(controls);
    body.appendChild(feedback);
    body.appendChild(solutionBox);
  }

  // ---- widgets -----------------------------------------------------------

  function buildWidget(spec, level) {
    if (spec.type === 'simulation') {
      const kind = level.config.kind;
      if (kind === 'projectile') return buildProjectile(level.config);
      if (kind === 'numberline') return buildNumberline(level.config);
      if (kind === 'area') return buildArea(level.config);
    }
    if (spec.type === 'quiz') return buildQuiz(level.config);
    if (spec.type === 'fillblank') return buildFill(level.config);
    if (spec.type === 'matching') return buildMatching(level.config);
    return { node: el('p', 'panel-text', '(unsupported type)'), check: () => ({ ok: false }) };
  }

  function sliderRow(labelText, min, max, step, value, fmt, onInput) {
    const row = el('div', 'slider-row');
    row.appendChild(el('label', 'slider-label', labelText));
    const input = document.createElement('input');
    input.type = 'range';
    input.min = min; input.max = max; input.step = step; input.value = value;
    const val = el('span', 'slider-value', fmt(value));
    input.addEventListener('input', () => {
      const v = Number(input.value);
      val.textContent = fmt(v);
      onInput(v);
    });
    const right = el('div', 'slider-right');
    right.appendChild(val);
    row.appendChild(input);
    row.appendChild(right);
    return { row, input };
  }

  function buildProjectile(cfg) {
    const node = el('div', 'widget');
    const canvas = document.createElement('canvas');
    canvas.width = 480; canvas.height = 220; canvas.className = 'sim-canvas';
    node.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let speed = (cfg.speedRange[0] + cfg.speedRange[1]) / 2;
    let angle = 45;
    const speedRow = sliderRow('v (m/s)', cfg.speedRange[0], cfg.speedRange[1], 0.5, speed, (v) => v.toFixed(1), (v) => { speed = v; draw(); });
    const angleRow = sliderRow('θ (deg)', cfg.angleRange[0], cfg.angleRange[1], 1, angle, (v) => v.toFixed(0) + '°', (v) => { angle = v; draw(); });
    node.appendChild(speedRow.row);
    node.appendChild(angleRow.row);

    function draw() {
      const W = canvas.width, H = canvas.height, pad = 34, groundY = H - 28;
      const g = cfg.gravity, rad = angle * Math.PI / 180;
      const range = (speed * speed * Math.sin(2 * rad)) / g;
      const maxX = Math.max(cfg.target, range, 5) * 1.15;
      const maxYworld = Math.max((speed * speed * Math.sin(rad) ** 2) / (2 * g), 2) * 1.2;
      const pxX = (x) => pad + (x / maxX) * (W - 2 * pad);
      const pxY = (y) => groundY - (y / maxYworld) * (groundY - 18);

      ctx.clearRect(0, 0, W, H);
      // ground
      ctx.strokeStyle = '#9aa4b2'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();
      // target flag
      const tx = pxX(cfg.target);
      ctx.strokeStyle = '#e8563f'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tx, groundY); ctx.lineTo(tx, groundY - 26); ctx.stroke();
      ctx.fillStyle = '#e8563f';
      ctx.beginPath(); ctx.moveTo(tx, groundY - 26); ctx.lineTo(tx + 14, groundY - 21); ctx.lineTo(tx, groundY - 16); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6b7280'; ctx.font = '11px system-ui';
      ctx.fillText(T('player.tooltipTarget'), tx - 10, groundY + 16);
      // launcher
      ctx.fillStyle = '#3f6ae0';
      ctx.beginPath(); ctx.arc(pxX(0), groundY, 4, 0, Math.PI * 2); ctx.fill();
      // trajectory
      const Tf = (2 * speed * Math.sin(rad)) / g;
      ctx.strokeStyle = '#3f6ae0'; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const t = (Tf * i) / 80;
        const x = speed * Math.cos(rad) * t;
        const y = Math.max(speed * Math.sin(rad) * t - 0.5 * g * t * t, 0);
        const X = pxX(x), Y = pxY(y);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke();
    }
    draw();

    return {
      node,
      check() {
        const g = cfg.gravity, rad = angle * Math.PI / 180;
        const range = (speed * speed * Math.sin(2 * rad)) / g;
        const dist = Math.abs(range - cfg.target);
        if (dist <= Math.max(1, cfg.target * 0.02)) return { ok: true };
        return { ok: false, message: range < cfg.target ? T('player.feedbackShort') : T('player.feedbackLong') };
      }
    };
  }

  function buildNumberline(cfg) {
    const node = el('div', 'widget');
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 480 120'); svg.setAttribute('class', 'sim-svg');
    node.appendChild(svg);

    let red = cfg.midpoint - cfg.offset;
    let blue = cfg.midpoint + cfg.offset;
    const redRow = sliderRow('red', cfg.min, cfg.max, 1, red, (v) => v.toFixed(0), (v) => { red = v; draw(); });
    const blueRow = sliderRow('blue', cfg.min, cfg.max, 1, blue, (v) => v.toFixed(0), (v) => { blue = v; draw(); });
    node.appendChild(redRow.row);
    node.appendChild(blueRow.row);

    function px(v) { return 30 + ((v - cfg.min) / (cfg.max - cfg.min)) * 420; }
    function draw() {
      svg.innerHTML = '';
      const mk = (tag, attrs) => { const e = document.createElementNS(svgNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
      svg.appendChild(mk('line', { x1: 30, y1: 60, x2: 450, y2: 60, stroke: '#9aa4b2', 'stroke-width': 2 }));
      for (let v = cfg.min; v <= cfg.max; v += 2) {
        const x = px(v);
        svg.appendChild(mk('line', { x1: x, y1: 55, x2: x, y2: 65, stroke: '#c3cad6', 'stroke-width': 1 }));
        const t = mk('text', { x, y: 85, 'text-anchor': 'middle', 'font-size': 10, fill: '#6b7280' });
        t.textContent = v; svg.appendChild(t);
      }
      // midpoint marker
      const mx = px(cfg.midpoint);
      svg.appendChild(mk('line', { x1: mx, y1: 40, x2: mx, y2: 80, stroke: '#6b7280', 'stroke-width': 2, 'stroke-dasharray': '4 3' }));
      // rovers
      const rx = px(red), bx = px(blue);
      svg.appendChild(mk('circle', { cx: rx, cy: 45, r: 8, fill: '#e8563f' }));
      svg.appendChild(mk('circle', { cx: bx, cy: 45, r: 8, fill: '#3f6ae0' }));
    }
    draw();

    return {
      node,
      check() {
        const dRed = red - cfg.midpoint, dBlue = blue - cfg.midpoint;
        const ok = Math.abs(Math.abs(dRed) - Math.abs(dBlue)) < 0.001 && dRed * dBlue < 0;
        return { ok, message: ok ? '' : T('player.wrong') };
      }
    };
  }

  function buildArea(cfg) {
    const node = el('div', 'widget');
    const canvas = document.createElement('canvas');
    canvas.width = 480; canvas.height = 200; canvas.className = 'sim-canvas';
    node.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    let width = cfg.width, height = cfg.height;
    const wRow = sliderRow('width', cfg.widthRange[0], cfg.widthRange[1], 1, width, (v) => v.toFixed(0), (v) => { width = v; draw(); });
    const hRow = sliderRow('height', cfg.heightRange[0], cfg.heightRange[1], 1, height, (v) => v.toFixed(0), (v) => { height = v; draw(); });
    node.appendChild(wRow.row);
    node.appendChild(hRow.row);

    const input = document.createElement('input');
    input.type = 'text'; input.className = 'answer-input'; input.placeholder = '?';
    const answerRow = el('div', 'answer-row');
    answerRow.appendChild(el('label', 'slider-label', cfg.metric === 'area' ? 'Area' : 'Perimeter'));
    answerRow.appendChild(input);
    node.appendChild(answerRow);

    function draw() {
      const W = canvas.width, H = canvas.height, pad = 30;
      const maxDim = Math.max(cfg.widthRange[1], cfg.heightRange[1]);
      const scale = (Math.min(W, H) - 2 * pad) / maxDim;
      const rw = width * scale, rh = height * scale;
      const x = (W - rw) / 2, y = (H - rh) / 2;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(63,106,224,0.12)'; ctx.strokeStyle = '#3f6ae0'; ctx.lineWidth = 2;
      ctx.fillRect(x, y, rw, rh); ctx.strokeRect(x, y, rw, rh);
      ctx.fillStyle = '#374151'; ctx.font = '12px system-ui';
      ctx.fillText('w = ' + width, x + rw / 2 - 18, y - 6);
      ctx.fillText('h = ' + height, x - 34, y + rh / 2);
    }
    draw();

    return {
      node,
      check() {
        const value = cfg.metric === 'area' ? width * height : 2 * (width + height);
        const got = parseNum(input.value);
        if (!Number.isFinite(got)) return { ok: false, message: T('player.wrong') };
        return { ok: Math.abs(got - value) < 0.001 };
      }
    };
  }

  function buildQuiz(cfg) {
    const node = el('div', 'widget');
    const opts = cfg.options || [];
    let chosen = -1;
    opts.forEach((opt, i) => {
      const lab = el('label', 'option');
      const r = document.createElement('input');
      r.type = 'radio'; r.name = 'quiz-' + Math.random().toString(36).slice(2);
      r.addEventListener('change', () => { chosen = i; });
      lab.appendChild(r);
      lab.appendChild(el('span', 'option-text', L(opt)));
      node.appendChild(lab);
    });
    return {
      node,
      check() { return { ok: chosen === cfg.answerIndex }; }
    };
  }

  function buildFill(cfg) {
    const node = el('div', 'widget');
    const input = document.createElement('input');
    input.type = 'text'; input.className = 'answer-input'; input.placeholder = '?';
    const row = el('div', 'answer-row');
    row.appendChild(el('label', 'slider-label', '='));
    row.appendChild(input);
    node.appendChild(row);
    return {
      node,
      check() {
        const got = parseNum(input.value);
        if (!Number.isFinite(got)) return { ok: false, message: T('player.wrong') };
        return { ok: Math.abs(got - cfg.answer) <= (cfg.tolerance || 0.001) };
      }
    };
  }

  function buildMatching(cfg) {
    const node = el('div', 'widget matching');
    const pairs = cfg.pairs || [];
    const terms = el('div', 'col'); const defs = el('div', 'col');
    let selTerm = null, selDef = null;
    const matched = new Set();
    const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);

    shuffle(pairs.map((p, i) => ({ i, text: L(p.term) }))).forEach((t) => {
      const b = el('button', 'match-item', t.text);
      b.dataset.idx = t.i;
      b.addEventListener('click', () => {
        if (matched.has(Number(b.dataset.idx)) || b.classList.contains('done')) return;
        terms.querySelectorAll('.match-item').forEach((e) => e.classList.remove('sel'));
        b.classList.add('sel'); selTerm = b; tryPair();
      });
      terms.appendChild(b);
    });
    shuffle(pairs.map((p, i) => ({ i, text: L(p.def) }))).forEach((t) => {
      const b = el('button', 'match-item', t.text);
      b.dataset.idx = t.i;
      b.addEventListener('click', () => {
        if (matched.has(Number(b.dataset.idx)) || b.classList.contains('done')) return;
        defs.querySelectorAll('.match-item').forEach((e) => e.classList.remove('sel'));
        b.classList.add('sel'); selDef = b; tryPair();
      });
      defs.appendChild(b);
    });

    function tryPair() {
      if (!selTerm || !selDef) return;
      if (selTerm.dataset.idx === selDef.dataset.idx) {
        selTerm.classList.add('done'); selTerm.classList.remove('sel');
        selDef.classList.add('done'); selDef.classList.remove('sel');
        matched.add(Number(selTerm.dataset.idx));
      }
      selTerm = null; selDef = null;
    }

    node.appendChild(terms); node.appendChild(defs);
    return {
      node,
      check() { return { ok: matched.size === pairs.length && pairs.length > 0 }; }
    };
  }

  window.Engine = { renderInteractive, parseNum };
})();
