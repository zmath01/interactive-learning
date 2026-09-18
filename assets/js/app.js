// app.js — shell (header/nav/lang toggle) + hash router + views.
(function () {
  const T = (k) => I18n.t(k);
  const L = (o) => I18n.localize(o);
  let DATA = { interactives: [], builtin: [], user: [] };

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function navLink(href, key) {
    const a = el('a', 'nav-link', T(key));
    a.href = href;
    const cur = location.hash || '#/';
    if ((href === '#/' && (cur === '#/' || cur === '')) || (href !== '#/' && cur.startsWith(href))) {
      a.classList.add('active');
    }
    return a;
  }

  function buildShell() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    const header = el('header', 'site-header');
    const brand = el('a', 'brand'); brand.href = '#/';
    brand.appendChild(el('span', 'brand-mark', '◧'));
    brand.appendChild(el('span', 'brand-title', T('app.title')));
    header.appendChild(brand);

    const nav = el('nav', 'site-nav');
    nav.appendChild(navLink('#/', 'nav.library'));
    nav.appendChild(navLink('#/builder', 'nav.builder'));
    nav.appendChild(navLink('#/about', 'nav.about'));
    header.appendChild(nav);

    const lang = el('button', 'lang-toggle', I18n.getLang() === 'en' ? '中文' : 'EN');
    lang.setAttribute('aria-label', T('lang.label'));
    lang.addEventListener('click', () => I18n.toggle());
    header.appendChild(lang);

    app.appendChild(header);

    const tagline = el('p', 'tagline', T('app.tagline'));
    app.appendChild(tagline);

    const main = el('main', 'view'); main.id = 'view';
    app.appendChild(main);

    app.appendChild(el('footer', 'site-footer', T('footer.text')));
  }

  function route() {
    const view = document.getElementById('view');
    if (!view) return;
    view.innerHTML = '';
    const hash = location.hash || '#/';
    const parts = hash.replace(/^#\/?/, '').split('/');
    if (parts[0] === 'play' && parts[1]) renderPlayer(view, decodeURIComponent(parts[1]));
    else if (parts[0] === 'builder') renderBuilder(view);
    else if (parts[0] === 'about') renderAbout(view);
    else renderLibrary(view);
  }

  function card(spec, isUser) {
    const c = el('a', 'card');
    c.href = '#/play/' + encodeURIComponent(spec.id);
    c.appendChild(el('h3', 'card-title', L(spec.title)));
    const meta = el('div', 'card-meta');
    if (spec.subject) meta.appendChild(el('span', 'badge', L(spec.subject)));
    meta.appendChild(el('span', 'badge ghost', spec.type));
    if (isUser) meta.appendChild(el('span', 'badge mine', T('library.mine')));
    c.appendChild(meta);
    const p = el('p', 'card-desc', L(spec.intro));
    c.appendChild(p);
    c.appendChild(el('span', 'card-cta', T('card.play') + ' →'));
    return c;
  }

  function renderLibrary(view) {
    const h = el('div', 'section-head');
    h.appendChild(el('h1', 'section-title', T('library.title')));
    h.appendChild(el('p', 'section-sub', T('library.subtitle')));
    view.appendChild(h);

    const builtin = DATA.interactives.filter((s) => !DATA.user.some((u) => u.id === s.id));
    const grid = el('div', 'grid');
    builtin.forEach((s) => grid.appendChild(card(s, false)));
    view.appendChild(grid);

    view.appendChild(el('h2', 'subsection-title', T('library.mine')));
    if (!DATA.user.length) {
      view.appendChild(el('p', 'empty', T('library.empty')));
    } else {
      const ugrid = el('div', 'grid');
      DATA.user.forEach((s) => ugrid.appendChild(card(s, true)));
      view.appendChild(ugrid);
    }
  }

  function renderPlayer(view, id) {
    const spec = DATA.interactives.find((s) => s.id === id);
    const back = el('a', 'back-link', '← ' + T('back'));
    back.href = '#/';
    view.appendChild(back);
    if (!spec) { view.appendChild(el('p', 'empty', 'Not found.')); return; }
    const host = el('div', 'interactive');
    view.appendChild(host);
    window.Engine.renderInteractive(host, spec);
  }

  function renderBuilder(view) {
    const host = el('div', 'builder');
    view.appendChild(host);
    window.Builder.render(host, {
      onSaved() {
        window.loadData().then((d) => { DATA = d; location.hash = '#/'; });
      }
    });
  }

  function renderAbout(view) {
    const box = el('div', 'about');
    box.appendChild(el('h1', 'section-title', T('about.title')));
    box.appendChild(el('p', 'about-p', T('about.concept')));
    const links = el('div', 'about-links');
    const a1 = el('a', 'about-link', T('about.link.label')); a1.href = 'https://research.google/blog/the-future-of-practice-enabling-teachers-to-create-learning-interactives-with-generative-ui/'; a1.target = '_blank'; a1.rel = 'noopener';
    const a2 = el('a', 'about-link', T('about.library.label')); a2.href = 'https://research.google.com/p/learning-interactives'; a2.target = '_blank'; a2.rel = 'noopener';
    links.appendChild(a1); links.appendChild(a2);
    box.appendChild(links);
    box.appendChild(el('p', 'about-note', T('about.note')));
    box.appendChild(el('p', 'about-note', T('about.tech')));
    view.appendChild(box);
  }

  I18n.onChange(() => { buildShell(); route(); });
  window.addEventListener('hashchange', route);

  window.loadData().then((d) => {
    DATA = d;
    buildShell();
    route();
  }).catch((err) => {
    document.getElementById('app').innerHTML =
      '<p style="padding:2rem;font-family:system-ui">Failed to load data. Serve this site over HTTP (e.g. <code>python3 -m http.server</code>) — browsers block <code>fetch()</code> on <code>file://</code>.<br><small>' + err + '</small></p>';
  });
})();
