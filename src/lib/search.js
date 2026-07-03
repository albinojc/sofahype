export function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}


export function slugifySearch(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function scoreTitle(item, query) {
  const title = normalizeSearch(item.titulo);
  const original = normalizeSearch(item.titulo_original);
  const slug = slugifySearch(item.titulo || '');
  const aliases = (item.aliases || []).map((alias) => normalizeSearch(alias));

  if (title === query) return 1000;
  if (title.startsWith(query)) return 900;
  if (title.includes(query)) return 800;
  if (slug.includes(query)) return 760;

  // Só usamos título original quando não há resultado bom pelo título em português.
  // Isso evita casos como buscar "breaking" e aparecer "Crepúsculo: Amanhecer",
  // porque o título original contém "Breaking Dawn".
  if (original === query) return 700;
  if (original.startsWith(query)) return 650;
  if (original.includes(query)) return 600;
  if (aliases.some((alias) => alias === query)) return 580;
  if (aliases.some((alias) => alias.startsWith(query))) return 560;
  if (aliases.some((alias) => alias.includes(query))) return 540;

  return 0;
}

export function searchTitles(items, rawQuery, tipo = 'todos') {
  const query = normalizeSearch(rawQuery);
  const base = items.filter((item) => tipo === 'todos' || item.tipo === tipo);
  if (!query) return base;

  const primary = base
    .map((item) => {
      const title = normalizeSearch(item.titulo);
      const slug = slugifySearch(item.titulo || '');
      let score = 0;
      if (title === query) score = 1000;
      else if (title.startsWith(query)) score = 900;
      else if (title.includes(query)) score = 800;
      else if (slug.includes(query)) score = 760;
      return { item, score };
    })
    .filter((entry) => entry.score > 0);

  const source = primary.length
    ? primary
    : base
        .map((item) => ({ item, score: scoreTitle(item, query) }))
        .filter((entry) => entry.score > 0);

  return source
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return Number(b.item.nota_sofahype || 0) - Number(a.item.nota_sofahype || 0);
    })
    .map((entry) => entry.item);
}
