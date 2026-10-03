// As três notas do catálogo usam a escala 0–100. Arredondar só na exibição.
function validScore(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

export function getRankingScore(item) {
  if (validScore(item.nota_critica) && validScore(item.nota_publico)) {
    return (item.nota_critica + item.nota_publico) / 2;
  }
  // Preserva os registros legados pendentes de confirmação editorial.
  return validScore(item.nota_sofahype) ? item.nota_sofahype : -1;
}

function consensusFloor(item) {
  return validScore(item.nota_critica) && validScore(item.nota_publico)
    ? Math.min(item.nota_critica, item.nota_publico)
    : -1;
}

export function compareByScore(a, b) {
  return getRankingScore(b) - getRankingScore(a)
    || consensusFloor(b) - consensusFloor(a)
    || String(a.titulo || '').localeCompare(String(b.titulo || ''), 'pt-BR');
}

export function isRankingEligible(item) {
  return (item.status === undefined || item.status === 'ativo')
    && (item.status_disponibilidade === undefined || item.status_disponibilidade === 'ativo')
    && Array.isArray(item.plataformas) && item.plataformas.length > 0
    && getRankingScore(item) >= 0;
}
