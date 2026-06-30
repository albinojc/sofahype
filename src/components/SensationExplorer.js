'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import TitleGrid from './TitleGrid';
import { normalizeSearch } from '../lib/search';

const SENSATIONS = [
  {
    key: 'divertir',
    label: '🍿 Quero me divertir',
    short: 'me divertir',
    description: 'Filmes com encaixe mais seguro para rir, relaxar ou ver algo movimentado sem clima pesado.'
  },
  {
    key: 'emocionar',
    label: '❤️ Quero me emocionar',
    short: 'me emocionar',
    description: 'Histórias com mais sentimento, relações fortes ou carga dramática clara.'
  },
  {
    key: 'pensar',
    label: '🧠 Quero pensar',
    short: 'pensar',
    description: 'Títulos que pedem atenção, trazem ideias fortes ou deixam assunto depois que acabam.'
  },
  {
    key: 'assustar',
    label: '👻 Quero me assustar',
    short: 'me assustar',
    description: 'Só entram títulos com sinal claro de terror, sustos, medo ou tensão pesada. Suspense leve não basta.'
  },
  {
    key: 'aventura',
    label: '🚀 Quero aventura',
    short: 'aventura',
    description: 'Filmes com movimento, ação, jornada, fantasia ou ficção científica com senso de aventura.'
  },
  {
    key: 'leve',
    label: '😌 Algo leve e fácil',
    short: 'algo leve e fácil',
    description: 'Opções mais fáceis de entrar, sem clima adulto, terror, crime pesado ou tensão constante.'
  }
];

const MIN_SCORE = 50;

function normalizedList(list) {
  return (list || []).map((item) => normalizeSearch(item));
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(normalizeSearch(term)));
}

function hasGenre(flags, terms) {
  return terms.some((term) => flags.genres.some((genre) => genre.includes(normalizeSearch(term))));
}

function buildFlags(item) {
  const genres = normalizedList(item.generos);
  const experience = normalizedList(item.experiencia);
  const ideal = normalizedList(item.ideal_para);
  const avoid = normalizedList(item.talvez_nao_seja);
  const fullText = normalizeSearch([
    item.titulo,
    item.titulo_original,
    ...(item.generos || []),
    ...(item.experiencia || []),
    ...(item.ideal_para || []),
    ...(item.talvez_nao_seja || []),
    item.sinopse
  ].join(' '));

  const flags = { genres, experience, ideal, avoid, fullText };

  flags.comedy = hasGenre(flags, ['comedia']);
  flags.drama = hasGenre(flags, ['drama']);
  flags.romance = hasGenre(flags, ['romance']);
  flags.family = hasGenre(flags, ['familia']);
  flags.animation = hasGenre(flags, ['animacao']);
  flags.adventure = hasGenre(flags, ['aventura']);
  flags.action = hasGenre(flags, ['acao']);
  flags.fantasy = hasGenre(flags, ['fantasia']);
  flags.scifi = hasGenre(flags, ['ficcao cientifica', 'science fiction']);
  flags.documentary = hasGenre(flags, ['documentario']);
  flags.history = hasGenre(flags, ['historia']);
  flags.music = hasGenre(flags, ['musica', 'musical']);
  flags.horror = hasGenre(flags, ['terror']);
  flags.crime = hasGenre(flags, ['crime']);
  flags.war = hasGenre(flags, ['guerra']);
  flags.mystery = hasGenre(flags, ['misterio']);
  flags.thriller = hasGenre(flags, ['suspense', 'thriller']);

  flags.kidSignal = flags.family || hasAny(fullText, ['ver com criancas', 'aventura para criancas', 'criancas pequenas', 'infantil']);
  flags.fearSignal = flags.horror || hasAny(fullText, ['clima de medo', 'tem sustos', 'assustador', 'sobrenatural', 'terror']);
  flags.heavySignal = hasAny(fullText, [
    'clima pesado',
    'clima adulto',
    'humor pesado',
    'crime e tensao',
    'crime com humor pesado',
    'violencia',
    'assassin',
    'morte',
    'gangue',
    'trafic',
    'guerra',
    'tensao constante'
  ]);
  flags.attentionSignal = hasAny(fullText, ['pede atencao', 'precisa prestar atencao', 'tem misterio', 'historia contada fora da ordem']);
  flags.lightSignal = hasAny(fullText, ['clima leve', 'visual colorido', 'historia facil de acompanhar', 'tem humor', 'dar risada', 'comedia leve']);
  flags.movementSignal = hasAny(fullText, ['bem movimentado', 'acao e aventura', 'nao fica parado', 'mundo de fantasia', 'mistura ciencia e imaginacao']);
  flags.emotionSignal = hasAny(fullText, ['historias intensas', 'historia mais seria', 'foco nas relacoes', 'historias de amor', 'emocao']);

  return flags;
}

function curationScore(item, sensationKey) {
  const score = Number(item.nota_sofahype || 0);
  if (score < MIN_SCORE) return 0;

  const f = buildFlags(item);
  const base = Math.max(score, Number(item.nota_publico || 0), Number(item.nota_tmdb || 0) * 10 || 0);
  const qualityBonus = Math.min(12, Math.max(0, score - 70) / 2);

  switch (sensationKey) {
    case 'assustar': {
      // Regra rígida: "quero me assustar" não aceita família, animação infantil,
      // aventura leve ou suspense genérico. Precisa ter sinal claro de medo/terror.
      if (f.family || f.kidSignal || f.music || f.documentary || f.comedy || f.romance) return 0;
      if (!f.fearSignal && !(f.thriller && f.heavySignal)) return 0;
      return base + qualityBonus + (f.horror ? 18 : 8) + (f.heavySignal ? 5 : 0);
    }

    case 'leve': {
      if (f.horror || f.crime || f.war || f.thriller || f.heavySignal || f.fearSignal) return 0;
      if (!(f.family || f.animation || f.comedy || f.romance || f.lightSignal)) return 0;
      return base + qualityBonus + (f.family ? 10 : 0) + (f.comedy ? 8 : 0) + (f.lightSignal ? 8 : 0);
    }

    case 'divertir': {
      if (f.horror || f.war || f.fearSignal) return 0;
      if (f.crime && !f.comedy) return 0;
      if (f.heavySignal && !(f.action || f.adventure || f.comedy)) return 0;
      if (!(f.comedy || f.adventure || f.action || f.animation || f.lightSignal || f.movementSignal)) return 0;
      return base + qualityBonus + (f.comedy ? 12 : 0) + (f.movementSignal ? 8 : 0) + (f.family ? 4 : 0);
    }

    case 'emocionar': {
      if (f.horror || f.fearSignal || f.war) return 0;
      if (!(f.drama || f.romance || f.family || f.emotionSignal)) return 0;
      // Crime pode emocionar, mas para curadoria da home é mais arriscado. Só entra se também for drama forte.
      if (f.crime && !f.drama) return 0;
      return base + qualityBonus + (f.drama ? 10 : 0) + (f.romance ? 8 : 0) + (f.emotionSignal ? 8 : 0);
    }

    case 'pensar': {
      if (f.kidSignal && !f.scifi && !f.fantasy) return 0;
      if (!(f.documentary || f.history || f.scifi || f.mystery || f.attentionSignal || (f.drama && f.heavySignal))) return 0;
      return base + qualityBonus + (f.documentary ? 12 : 0) + (f.attentionSignal ? 10 : 0) + (f.scifi ? 8 : 0) + (f.history ? 6 : 0);
    }

    case 'aventura': {
      if (f.horror || f.fearSignal || f.war) return 0;
      if (!(f.adventure || f.action || f.fantasy || f.scifi || f.movementSignal)) return 0;
      // Evita jogar drama/crime pesado como aventura só porque há ação.
      if (f.crime && f.heavySignal && !f.adventure && !f.fantasy && !f.scifi) return 0;
      return base + qualityBonus + (f.adventure ? 12 : 0) + (f.action ? 10 : 0) + (f.fantasy || f.scifi ? 8 : 0);
    }

    default:
      return 0;
  }
}

export default function SensationExplorer({ items }) {
  const [selected, setSelected] = useState(SENSATIONS[0].key);
  const active = SENSATIONS.find((item) => item.key === selected) || SENSATIONS[0];

  const filtered = useMemo(() => {
    return items
      .filter((item) => item.tipo === 'filme')
      .map((item) => ({ item, curation: curationScore(item, active.key) }))
      .filter(({ curation }) => curation > 0)
      .sort((a, b) => b.curation - a.curation)
      .map(({ item }) => item)
      .slice(0, 6);
  }, [items, active]);

  return (
    <>
      <section className="humor-section">
        <div className="section-label">✦ Escolha por sensação</div>
        <div className="moods" role="tablist" aria-label="Escolha por sensação">
          {SENSATIONS.map((sensation) => (
            <button
              key={sensation.key}
              type="button"
              className={selected === sensation.key ? 'mood active' : 'mood'}
              onClick={() => setSelected(sensation.key)}
              aria-pressed={selected === sensation.key}
            >
              {sensation.label}
            </button>
          ))}
        </div>
      </section>

      <div className="divider" />

      <section className="section">
        <div className="section-header section-header-with-copy">
          <div>
            <h2 className="section-title">Escolhas para <span>{active.short}</span></h2>
            <p className="curation-note">{active.description} Mostramos menos títulos quando o encaixe não é seguro.</p>
          </div>
          <Link className="btn-ver-todos" href="/filmes">Ver todos →</Link>
        </div>

        {filtered.length ? (
          <TitleGrid items={filtered} />
        ) : (
          <div className="empty-curation">
            Ainda não temos opções seguras para essa sensação no catálogo atual. Melhor mostrar menos do que indicar errado.
          </div>
        )}
      </section>
    </>
  );
}
