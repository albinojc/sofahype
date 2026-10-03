export function hasConfirmedScores(item, review) {
  if (!review || review.id !== item.id || review.titulo !== item.titulo
    || review.ano !== item.ano || review.tipo !== item.tipo) return false;
  const { nota_critica: critics, nota_publico: audience, nota_sofahype: score } = review;
  if (![critics, audience, score].every((value) => typeof value === 'number'
    && Number.isFinite(value) && value >= 0 && value <= 100)) return false;
  return /^https:\/\/www\.rottentomatoes\.com\/(m|tv)\/[\w-]+$/.test(review.rotten_tomatoes)
    && /^https:\/\/www\.imdb\.com\/title\/tt\d+\/$/.test(review.imdb)
    && /^\d{4}-\d{2}-\d{2}$/.test(review.verificado_em)
    && score === (critics + audience) / 2
    && item.nota_critica === critics && item.nota_publico === audience
    && item.nota_sofahype === score;
}
