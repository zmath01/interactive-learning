// builder.js — teacher-facing "generative UI": form -> spec -> live preview -> save/export.
(function () {
  const T = (k) => I18n.t(k);

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);
  const splitPair = (s) => String(s || '').split('|').map((x) => x.trim());
  function zip(enLines, zhLines) {
    const n = Math.max(enLines.length, zhLines.length);
    const out = [];
    for (let i = 0; i < n; i++) {
      const en = enLines[i] || zhLines[i] || '';
      const zh = zhLines[i] || enLines[i] || '';
      out.push({ en, zh });
    }
    return out;
  }

  function emptyLevel() {
    return {
      prompt: { en: '', zh: '' },
      hintsEn: '', hintsZh: '',
      solution: { en: '', zh: '' },
      optionsEn: '', optionsZh: '', correct: 0,
      answer: '', tolerance: '0.001',
      pairsEn: '', pairsZh: ''
    };
  }

  const model = {
    id: '', type: 'quiz',
    title: { en: '', zh: '' },
    subject: { en: '', zh: '' },
    intro: { en: '', zh: '' },
    levels: [emptyLevel()]
  };

  function field(labelKey, prop, opts) {
    opts = opts || {};
    const wrap = el('div', 'field');
    wrap.appendChild(el('label', 'field-label', T(labelKey)));
    const input = document.createElement(opts.area ? 'textarea' : 'input');
    if (!opts.area) input.type = opts.type || 'text';
    if (opts.area) input.rows = opts.rows || 3;
    input.value = opts.get();
    input.addEventListener('input', () => opts.set(input.value));
    wrap.appendChild(input);
    return wrap;
  }

  function levelCard(lv, i, rerender) {
    const card = el('div', 'level-card');
    const head = el('div', 'level-card-head');
    head.appendChild(el('h4', 'level-card-title', T('player.level') + ' ' + (i + 1)));
    if (model.levels.length > 1) {
      const rm = el('button', 'btn btn-ghost btn-sm', T('builder.removeLevel'));
      rm.addEventListener('click', () => { model.levels.splice(i, 1); rerender(); });
      head.appendChild(rm);
    }
    card.appendChild(head);

    card.appendChild(field('builder.levelPromptEn', 'prompt.en', { get: () => lv.prompt.en, set: (v) => lv.prompt.en = v, area: true, rows: 2 }));
    card.appendChild(field('builder.levelPromptZh', 'prompt.zh', { get: () => lv.prompt.zh, set: (v) => lv.prompt.zh = v, area: true, rows: 2 }));

    if (model.type === 'quiz') {
      card.appendChild(field('builder.options', 'optionsEn', { get: () => lv.optionsEn, set: (v) => lv.optionsEn = v, area: true, rows: 4 }));
      card.appendChild(field('builder.options', 'optionsZh', { get: () => lv.optionsZh, set: (v) => lv.optionsZh = v, area: true, rows: 4 }));
      card.appendChild(field('builder.correct', 'correct', { get: () => lv.correct, set: (v) => lv.correct = v, type: 'number' }));
    } else if (model.type === 'fillblank') {
      card.appendChild(field('builder.answer', 'answer', { get: () => lv.answer, set: (v) => lv.answer = v }));
      card.appendChild(field('builder.tolerance', 'tolerance', { get: () => lv.tolerance, set: (v) => lv.tolerance = v }));
    } else if (model.type === 'matching') {
      card.appendChild(field('builder.pairs', 'pairsEn', { get: () => lv.pairsEn, set: (v) => lv.pairsEn = v, area: true, rows: 4 }));
      card.appendChild(field('builder.pairs', 'pairsZh', { get: () => lv.pairsZh, set: (v) => lv.pairsZh = v, area: true, rows: 4 }));
    }

    card.appendChild(field('builder.hints', 'hintsEn', { get: () => lv.hintsEn, set: (v) => lv.hintsEn = v, area: true, rows: 3 }));
    card.appendChild(field('builder.hints', 'hintsZh', { get: () => lv.hintsZh, set: (v) => lv.hintsZh = v, area: true, rows: 3 }));
    card.appendChild(field('builder.solutionEn', 'solution.en', { get: () => lv.solution.en, set: (v) => lv.solution.en = v, area: true, rows: 2 }));
    card.appendChild(field('builder.solutionZh', 'solution.zh', { get: () => lv.solution.zh, set: (v) => lv.solution.zh = v, area: true, rows: 2 }));
    return card;
  }

  function toSpec() {
    return {
      id: model.id || 'untitled',
      type: model.type,
      title: { en: model.title.en, zh: model.title.zh || model.title.en },
      subject: { en: model.subject.en, zh: model.subject.zh || model.subject.en },
      intro: { en: model.intro.en, zh: model.intro.zh || model.intro.en },
      levels: model.levels.map((lv) => {
        const level = {
          prompt: { en: lv.prompt.en, zh: lv.prompt.zh || lv.prompt.en },
          hints: zip(lines(lv.hintsEn), lines(lv.hintsZh)),
          solution: { en: lv.solution.en, zh: lv.solution.zh || lv.solution.en }
        };
        if (model.type === 'quiz') {
          level.config = {
            kind: 'quiz',
            options: zip(lines(lv.optionsEn), lines(lv.optionsZh)).map((o) => ({ en: o.en, zh: o.zh })),
            answerIndex: Number(lv.correct) || 0
          };
        } else if (model.type === 'fillblank') {
          level.config = { kind: 'fill', answer: Number(lv.answer) || 0, tolerance: Number(lv.tolerance) || 0.001 };
        } else if (model.type === 'matching') {
          const pe = lines(lv.pairsEn), pz = lines(lv.pairsZh);
          const n = Math.max(pe.length, pz.length);
          const pairs = [];
          for (let i = 0; i < n; i++) {
            const a = splitPair(pe[i] || pz[i] || '');
            const b = splitPair(pz[i] || pe[i] || '');
            pairs.push({ term: { en: a[0] || b[0] || '', zh: b[0] || a[0] || '' }, def: { en: a[1] || b[1] || '', zh: b[1] || a[1] || '' } });
          }
          level.config = { kind: 'matching', pairs };
        }
        return level;
      })
    };
  }

  function download(name, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function render(host, opts) {
    opts = opts || {};
    host.innerHTML = '';
    host.appendChild(el('h1', 'section-title', T('builder.title')));
    host.appendChild(el('p', 'section-sub', T('builder.intro')));

    const form = el('div', 'builder-form');
    const preview = el('div', 'builder-preview');
    const rerender = () => render(host, opts);

    form.appendChild(field('builder.name', 'id', { get: () => model.id, set: (v) => model.id = v.trim() }));
    form.appendChild(field('builder.titleEn', 'title.en', { get: () => model.title.en, set: (v) => model.title.en = v }));
    form.appendChild(field('builder.titleZh', 'title.zh', { get: () => model.title.zh, set: (v) => model.title.zh = v }));
    form.appendChild(field('builder.subjectEn', 'subject.en', { get: () => model.subject.en, set: (v) => model.subject.en = v }));
    form.appendChild(field('builder.subjectZh', 'subject.zh', { get: () => model.subject.zh, set: (v) => model.subject.zh = v }));
    form.appendChild(field('builder.introEn', 'intro.en', { get: () => model.intro.en, set: (v) => model.intro.en = v, area: true, rows: 2 }));
    form.appendChild(field('builder.introZh', 'intro.zh', { get: () => model.intro.zh, set: (v) => model.intro.zh = v, area: true, rows: 2 }));

    const typeWrap = el('div', 'field');
    typeWrap.appendChild(el('label', 'field-label', T('builder.type')));
    const sel = document.createElement('select');
    [['quiz', 'builder.type.quiz'], ['fillblank', 'builder.type.fillblank'], ['matching', 'builder.type.matching']].forEach(([v, k]) => {
      const o = document.createElement('option'); o.value = v; o.textContent = T(k);
      if (model.type === v) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener('change', () => { model.type = sel.value; rerender(); });
    typeWrap.appendChild(sel);
    form.appendChild(typeWrap);

    form.appendChild(el('h3', 'builder-h', T('builder.levels')));
    model.levels.forEach((lv, i) => form.appendChild(levelCard(lv, i, rerender)));

    const add = el('button', 'btn btn-ghost', '+ ' + T('builder.addLevel'));
    add.addEventListener('click', () => { model.levels.push(emptyLevel()); rerender(); });
    form.appendChild(add);

    const actions = el('div', 'builder-actions');
    const pv = el('button', 'btn', T('builder.preview'));
    pv.addEventListener('click', () => { preview.innerHTML = ''; window.Engine.renderInteractive(preview, toSpec()); preview.scrollIntoView({ behavior: 'smooth' }); });
    const save = el('button', 'btn btn-primary', T('builder.save'));
    save.addEventListener('click', () => {
      if (!model.id || !model.title.en) { alert(T('builder.needTitle')); return; }
      const spec = toSpec();
      let list = [];
      try { list = JSON.parse(localStorage.getItem('userInteractives') || '[]'); } catch (_) { list = []; }
      const idx = list.findIndex((s) => s.id === spec.id);
      if (idx >= 0) list[idx] = spec; else list.push(spec);
      window.saveUserInteractives(list);
      alert(T('builder.saved'));
      if (opts.onSaved) opts.onSaved();
    });
    const exp = el('button', 'btn', T('builder.export'));
    exp.addEventListener('click', () => download((model.id || 'interactive') + '.json', JSON.stringify(toSpec(), null, 2)));
    actions.appendChild(pv); actions.appendChild(save); actions.appendChild(exp);
    form.appendChild(actions);

    const grid = el('div', 'builder-grid');
    grid.appendChild(form);
    const previewWrap = el('div', 'preview-col');
    previewWrap.appendChild(el('h3', 'builder-h', T('builder.preview')));
    previewWrap.appendChild(preview);
    grid.appendChild(previewWrap);

    host.appendChild(grid);
  }

  window.Builder = { render };
})();
