// data.js — load interactives + UI strings, merge user-created interactives from localStorage.
async function loadData() {
  const [i18nRes, interRes] = await Promise.all([
    fetch('./data/i18n.json'),
    fetch('./data/interactives.json')
  ]);
  const i18n = await i18nRes.json();
  const builtin = await interRes.json();

  I18n.setStrings(i18n);

  let user = [];
  try {
    user = JSON.parse(localStorage.getItem('userInteractives') || '[]');
    if (!Array.isArray(user)) user = [];
  } catch (_) { user = []; }

  const interactives = builtin.concat(user);
  return { interactives, builtin, user };
}

function saveUserInteractives(list) {
  localStorage.setItem('userInteractives', JSON.stringify(list));
}

window.loadData = loadData;
window.saveUserInteractives = saveUserInteractives;
