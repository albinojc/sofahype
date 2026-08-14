export const STREAMING_PROVIDERS = Object.freeze([
  Object.freeze({ nome: 'Netflix', providerId: 8, regiao: 'BR' }),
  Object.freeze({ nome: 'HBO Max', providerId: 1899, regiao: 'BR' }),
  Object.freeze({ nome: 'Prime Video', providerId: 119, regiao: 'BR' }),
  Object.freeze({ nome: 'Disney+', providerId: 337, regiao: 'BR' }),
  Object.freeze({ nome: 'Globoplay', providerId: 307, regiao: 'BR' }),
  Object.freeze({ nome: 'Apple TV', providerId: 350, regiao: 'BR' }),
  Object.freeze({ nome: 'Paramount+', providerId: 531, regiao: 'BR' }),
  Object.freeze({ nome: 'Hulu', providerId: 15, regiao: 'US' })
]);

const PROVIDERS_BY_REGION = new Map([
  ['BR', STREAMING_PROVIDERS.filter((provider) => provider.regiao === 'BR')],
  ['US', STREAMING_PROVIDERS.filter((provider) => provider.regiao === 'US')]
]);

function numericProviderIds(flatrate = []) {
  return new Set(
    (Array.isArray(flatrate) ? flatrate : [])
      .map((provider) => Number(provider?.provider_id))
      .filter(Number.isFinite)
  );
}

function detectByRegion(flatrate, region) {
  const ids = numericProviderIds(flatrate);
  return (PROVIDERS_BY_REGION.get(region) || [])
    .filter((provider) => ids.has(provider.providerId))
    .map((provider) => provider.nome);
}

export function detectarPlataformasBR(flatrate) {
  return detectByRegion(flatrate, 'BR');
}

export function detectarHuluUS(flatrate) {
  return detectByRegion(flatrate, 'US');
}

export function detectarPlataformasSofahype({ brFlatrate = [], usFlatrate = [] } = {}) {
  return [...detectarPlataformasBR(brFlatrate), ...detectarHuluUS(usFlatrate)];
}

export function nomesCanonicosSofahype() {
  return STREAMING_PROVIDERS.map((provider) => provider.nome);
}

export function normalizarPlataformaHistorica(nome) {
  return nome === 'Max' ? 'HBO Max' : nome;
}

export function normalizarPlataformasHistoricas(plataformas = []) {
  return [...new Set(
    (Array.isArray(plataformas) ? plataformas : []).map(normalizarPlataformaHistorica)
  )];
}

export function executarAutotesteProviders() {
  const br = detectarPlataformasBR([
    { provider_id: 8 },
    { provider_id: 1899 },
    { provider_id: 119 },
    { provider_id: 337 },
    { provider_id: 307 },
    { provider_id: 350 },
    { provider_id: 531 },
    { provider_id: 1825 },
    { provider_id: 582 },
    { provider_id: 1853 },
    { provider_id: 2142 },
    { provider_id: 2107 },
    { provider_id: 2243 },
    { provider_id: 1796 },
    { provider_id: 2100 },
    { provider_id: 2303 },
    { provider_id: 15 }
  ]);
  const us = detectarHuluUS([{ provider_id: 15 }, { provider_id: 8 }]);
  const expectedBR = ['Netflix', 'HBO Max', 'Prime Video', 'Disney+', 'Globoplay', 'Apple TV', 'Paramount+'];

  if (JSON.stringify(br) !== JSON.stringify(expectedBR)) {
    throw new Error(`Autoteste BR falhou: ${JSON.stringify(br)}`);
  }
  if (JSON.stringify(us) !== JSON.stringify(['Hulu'])) {
    throw new Error(`Autoteste Hulu falhou: ${JSON.stringify(us)}`);
  }
  if (normalizarPlataformaHistorica('Max') !== 'HBO Max') {
    throw new Error('Autoteste de normalização Max -> HBO Max falhou.');
  }

  return true;
}
