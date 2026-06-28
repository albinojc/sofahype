# SofáHype

O guia brasileiro para decidir o que assistir.

## O que este projeto já faz

- Home com busca e cards automáticos.
- Páginas de filmes e séries.
- Páginas por streaming.
- Página individual de cada título.
- Nota SofáHype.
- Hypômetro.
- Catálogo centralizado em `src/data/catalogo.json`.
- Importador TMDb em `scripts/import-tmdb.mjs`.

## Como o catálogo é atualizado

O Netlify roda este comando antes do build:

```bash
npm run import:tmdb && npm run build
```

O importador usa a variável segura:

```bash
TMDB_READ_ACCESS_TOKEN
```

No primeiro teste, o importador está configurado para buscar aproximadamente:

- 120 filmes
- 60 séries

Esses números ficam em `netlify.toml`:

```toml
TMDB_IMPORT_MOVIES = "120"
TMDB_IMPORT_SERIES = "60"
```

Depois que o teste estiver estável, podemos aumentar gradualmente até chegar ao objetivo de 2.000 filmes e 1.000 séries.
