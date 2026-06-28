# SofáHype

O guia brasileiro para decidir o que assistir.

## O que este projeto já faz

- Home com busca e cards automáticos.
- Páginas de filmes e séries.
- Páginas por streaming.
- Página individual de cada título.
- Nota SofáHype.
- Hypômetro.
- Catálogo separado em `src/data/catalogo.json`.

## Como atualizar o catálogo

Abra o arquivo:

`src/data/catalogo.json`

Cada item representa um filme ou série.

Campos principais:

- `tipo`: `filme` ou `serie`
- `titulo`
- `ano`
- `generos`
- `plataformas`
- `nota_sofahype`
- `nota_critica`
- `nota_publico`
- `poster_url`
- `sinopse`
- `experiencia`
- `ideal_para`
- `talvez_nao_seja`

## Como publicar no Netlify

1. Suba esta pasta para um repositório no GitHub.
2. No Netlify, escolha "Add new site".
3. Escolha "Import an existing project".
4. Conecte o GitHub.
5. Escolha o repositório `sofahype`.
6. O Netlify vai rodar `npm run build` e publicar o site.
