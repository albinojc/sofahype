# SofáHype

O guia brasileiro para decidir o que assistir.

## O que este projeto já faz

- Home com busca e cards automáticos.
- Páginas de filmes e séries.
- Páginas por streaming.
- Página individual de cada título.
- Nota SofáHype.
- Hypômetro com iconografia própria.
- Página/estado de busca sem resultado com o sofá "Vacilei!".
- Catálogo centralizado em `src/data/catalogo.json`.
- Importador TMDb em `scripts/import-tmdb.mjs`.

## Hypômetro

- Sofá Galático: 90–100%
- Sofá Quente: 75–89%
- Sofá OK: 50–74%
- Sofá Fraco: abaixo de 50%

## Como o catálogo é atualizado

O Netlify roda este comando antes do build:

```bash
npm run import:tmdb && npm run build
```

O importador usa a variável segura:

```bash
TMDB_READ_ACCESS_TOKEN
```

Nesta versão, o importador está configurado para buscar aproximadamente:

- 500 filmes
- 250 séries

Esses números ficam em `netlify.toml`:

```toml
TMDB_IMPORT_MOVIES = "500"
TMDB_IMPORT_SERIES = "250"
```

Depois que essa fase estiver estável, podemos subir gradualmente até chegar no objetivo de 2.000 filmes e 1.000 séries.

## Regra importante de credibilidade

A seção "Como é a experiência?" usa regras conservadoras. Não tratamos todo filme de comédia como "leve". Quando há crime, suspense, drama ou terror, o sistema prioriza o tom adulto/intenso para evitar recomendações enganosas.
