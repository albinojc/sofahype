# Auditoria dos rankings — outubro de 2026

Estado: recalibração concluída e autorizada para PR. Toy Story 5 atualizado também na configuração do carousel, exclusivamente nas notas. Validações repetidas em 03/10/2026.

Base: `9693b8afb3cfc03a35bdc9e2a22c3b5bec95acc8`, main e origin/main sincronizadas após fetch; último commit: Merge pull request #11 from albinojc/content/destaques-minecraft-terras-aniversario. Working tree inicialmente limpa. Branch: `content/atualiza-rankings-2026-10`.

Catálogo: 2444 → 2444 registros. 58 registros alterados exclusivamente nos três campos de nota. Nenhum título removido, nenhuma plataforma, disponibilidade, imagem, sinopse ou outro metadado alterado.

## Diagnóstico e divergências

- Home: oito filmes e oito séries. A ordenação anterior subtraía diretamente nota_sofahype; empates seguiam a ordem do JSON.
- Escala interna: 0–100 em todas as notas editoriais; nota_tmdb é outro campo, em 0–10, sem uso no novo cálculo. A apresentação divide por dez.
- Nos Top 30 anteriores, 29/30 filmes e 30/30 séries têm crítica nula e público igual ao TMDb multiplicado por dez. A coincidência é indício de legado, não comprovação da origem de cada nota.
- getCatalog exclui status oculto e disponibilidade fora de ativo/em_breve; em_breve exige plataforma e data válida. Status inativo e registros ativos sem plataforma não eram barrados explicitamente. A base atual tem todos os status ativo e nenhum ativo sem plataforma.
- A Home agora filtra candidatos ativos, disponíveis, com plataforma e nota; as listagens completas conservam os títulos e as regras públicas existentes.
- Comparador central em src/lib/ranking.js: média exata, maior mínimo entre crítica/público e título em pt-BR. Usado na Home, /filmes, /series e streamings. Busca mantém relevância e seu desempate anterior; curadoria por sensação mantém suas regras.
- Notas legadas sem ambas as fontes permanecem como estavam. Não foi feita recalibração por inferência.
- O validador rejeitava qualquer nota nos registros com origem_importacao=tmdb. Agora só admite notas correspondentes a uma revisão documentada, com identidade, URLs das duas fontes e média exata. O importador continua criando notas nulas.
- Corrigido formatScore: 94,5 deve aparecer como 9,5; dividir antes de toFixed produzia 9,4 por precisão binária. Arredondamento só na apresentação. A interface continua usando ponto decimal, como antes.

## Metodologia e fontes

Consulta em 01/10/2026. Crítica = Tomatometer geral do título; público = rating principal ponderado do IMDb, multiplicado por dez. Média armazenada sem arredondamento. Não usamos Popcornmeter, Metacritic nem temporadas isoladas. Algumas páginas do IMDb bloquearam acesso direto (403); nesses casos, a evidência veio do conteúdo indexado das próprias páginas oficiais. As fontes podem mudar depois da consulta. As URLs e valores de cada revisão constam também em src/data/scoreReviews.json.

## Ranking de filmes ANTES

| # | Título | Nota armazenada | Exibida |
|---|---|---:|---:|
| 1 | Avatar Aang: O Último Mestre do Ar | 92 | 9,2 |
| 2 | Devoradores de Estrelas | 89 | 8,9 |
| 3 | Como Mágica | 87 | 8,7 |
| 4 | Um Sonho de Liberdade | 87 | 8,7 |
| 5 | Interestelar | 85 | 8,5 |
| 6 | O Poderoso Chefão | 85 | 8,5 |
| 7 | O Justiceiro: Uma Última Morte | 84 | 8,4 |
| 8 | Batman: O Cavaleiro das Trevas | 84 | 8,4 |

## Ranking de filmes DEPOIS

Todos: status ativo; disponibilidade ativo. Plataformas preservadas do catálogo (Max é o nome editorial de HBO Max).

| # | Título | RT | IMDb | Média exata (0–100) | Armazenada / exibida | Plataformas | Status |
|---|---|---:|---:|---:|---|---|---|
| 1 | O Poderoso Chefão | [97%](https://www.rottentomatoes.com/m/the_godfather) | [9,2](https://www.imdb.com/title/tt0068646/) | 94,5 | 94,5 / 9,5 | Paramount+ | ativo |
| 2 | O Poderoso Chefão: Parte II | [96%](https://www.rottentomatoes.com/m/the_godfather_part_ii) | [9](https://www.imdb.com/title/tt0071562/) | 93 | 93 / 9,3 | Paramount+ | ativo |
| 3 | Batman: O Cavaleiro das Trevas | [94%](https://www.rottentomatoes.com/m/the_dark_knight) | [9,1](https://www.imdb.com/title/tt0468569/) | 92,5 | 92,5 / 9,3 | Max, Globoplay | ativo |
| 4 | Três Homens em Conflito | [97%](https://www.rottentomatoes.com/m/the_good_the_bad_and_the_ugly) | [8,8](https://www.imdb.com/title/tt0060196/) | 92,5 | 92,5 / 9,3 | Prime Video | ativo |
| 5 | O Senhor dos Anéis: O Retorno do Rei | [94%](https://www.rottentomatoes.com/m/the_lord_of_the_rings_the_return_of_the_king) | [9](https://www.imdb.com/title/tt0167260/) | 92 | 92 / 9,2 | Disney+, Max | ativo |
| 6 | Parasita | [99%](https://www.rottentomatoes.com/m/parasite_2019) | [8,5](https://www.imdb.com/title/tt6751668/) | 92 | 92 / 9,2 | Netflix, Prime Video | ativo |
| 7 | O Senhor dos Anéis: As Duas Torres | [95%](https://www.rottentomatoes.com/m/the_lord_of_the_rings_the_two_towers) | [8,8](https://www.imdb.com/title/tt0167261/) | 91,5 | 91,5 / 9,2 | Max | ativo |
| 8 | Toy Story: Um Mundo de Aventuras | [100%](https://www.rottentomatoes.com/m/toy_story) | [8,3](https://www.imdb.com/title/tt0114709/) | 91,5 | 91,5 / 9,2 | Disney+, Hulu | ativo |

Entraram: O Poderoso Chefão: Parte II; Três Homens em Conflito; O Senhor dos Anéis: O Retorno do Rei; Parasita; O Senhor dos Anéis: As Duas Torres; Toy Story: Um Mundo de Aventuras.

Saíram: Avatar Aang: O Último Mestre do Ar; Devoradores de Estrelas; Como Mágica; Um Sonho de Liberdade; Interestelar; O Justiceiro: Uma Última Morte.

Permaneceram no Top 8: O Poderoso Chefão (6 → 1); Batman: O Cavaleiro das Trevas (8 → 3).

## Ranking de séries ANTES

| # | Título | Nota armazenada | Exibida |
|---|---|---:|---:|
| 1 | Aprendendo a Lição | 91 | 9,1 |
| 2 | Breaking Bad | 91 | 9,1 |
| 3 | Frieren e a Jornada para o Além | 89 | 8,9 |
| 4 | Rick e Morty | 89 | 8,9 |
| 5 | Apenas um Show | 89 | 8,9 |
| 6 | Família Soprano | 89 | 8,9 |
| 7 | Off Campus: Amores Improváveis | 88 | 8,8 |
| 8 | The Pitt | 88 | 8,8 |

## Ranking de séries DEPOIS

Todos: status ativo; disponibilidade ativo. Plataformas preservadas do catálogo (Max é o nome editorial de HBO Max).

| # | Título | RT | IMDb | Média exata (0–100) | Armazenada / exibida | Plataformas | Status |
|---|---|---:|---:|---:|---|---|---|
| 1 | Avatar: A Lenda de Aang | [100%](https://www.rottentomatoes.com/tv/avatar_the_last_airbender) | [9,3](https://www.imdb.com/title/tt0417299/) | 96,5 | 96,5 / 9,7 | Netflix, Paramount+ | ativo |
| 2 | Breaking Bad | [96%](https://www.rottentomatoes.com/tv/breaking_bad) | [9,5](https://www.imdb.com/title/tt0903747/) | 95,5 | 95,5 / 9,6 | Netflix | ativo |
| 3 | Frieren e a Jornada para o Além | [100%](https://www.rottentomatoes.com/tv/frieren_beyond_journeys_end) | [8,9](https://www.imdb.com/title/tt22248376/) | 94,5 | 94,5 / 9,5 | Netflix, Max, Hulu | ativo |
| 4 | Gravity Falls: Um Verão de Mistérios | [100%](https://www.rottentomatoes.com/tv/gravity_falls) | [8,9](https://www.imdb.com/title/tt1865718/) | 94,5 | 94,5 / 9,5 | Disney+ | ativo |
| 5 | Better Call Saul | [98%](https://www.rottentomatoes.com/tv/better_call_saul) | [9](https://www.imdb.com/title/tt3032476/) | 94 | 94 / 9,4 | Netflix | ativo |
| 6 | A Escuta | [94%](https://www.rottentomatoes.com/tv/the-wire) | [9,3](https://www.imdb.com/title/tt0306414/) | 93,5 | 93,5 / 9,4 | Max | ativo |
| 7 | INVENCÍVEL | [99%](https://www.rottentomatoes.com/tv/invincible) | [8,7](https://www.imdb.com/title/tt6741278/) | 93 | 93 / 9,3 | Prime Video | ativo |
| 8 | The Pitt | [96%](https://www.rottentomatoes.com/tv/the_pitt) | [8,9](https://www.imdb.com/title/tt31938062/) | 92,5 | 92,5 / 9,3 | Max | ativo |

Entraram: Avatar: A Lenda de Aang; Gravity Falls: Um Verão de Mistérios; Better Call Saul; A Escuta; INVENCÍVEL.

Saíram: Aprendendo a Lição; Rick e Morty; Apenas um Show; Família Soprano; Off Campus: Amores Improváveis.

Permaneceram no Top 8: Breaking Bad (2 → 2); Frieren e a Jornada para o Além (3 → 3); The Pitt (8 → 8).

## Revisões confirmadas que ficaram fora dos Top 8

| Título | RT | IMDb | Média / exibida | Posição atual no tipo |
|---|---:|---:|---|---:|
| Avatar Aang: O Último Mestre do Ar | [90%](https://www.rottentomatoes.com/m/the_legend_of_aang_the_last_airbender) | [7,7](https://www.imdb.com/title/tt18259538/) | 83,5 / 8,4 | 24 |
| Devoradores de Estrelas | [95%](https://www.rottentomatoes.com/m/project_hail_mary) | [8,2](https://www.imdb.com/title/tt12042730/) | 88,5 / 8,9 | 18 |
| Como Mágica | [69%](https://www.rottentomatoes.com/m/swapped_2026) | [7,3](https://www.imdb.com/title/tt29552248/) | 71 / 7,1 | 238 |
| Um Sonho de Liberdade | [89%](https://www.rottentomatoes.com/m/shawshank_redemption) | [9,3](https://www.imdb.com/title/tt0111161/) | 91 / 9,1 | 9 |
| Interestelar | [73%](https://www.rottentomatoes.com/m/interstellar_2014) | [8,7](https://www.imdb.com/title/tt0816692/) | 80 / 8,0 | 29 |
| O Justiceiro: Uma Última Morte | [73%](https://www.rottentomatoes.com/m/the_punisher_one_last_kill) | [7](https://www.imdb.com/title/tt36042156/) | 71,5 / 7,2 | 237 |
| Homem-Aranha: No Aranhaverso | [97%](https://www.rottentomatoes.com/m/spider_man_into_the_spider_verse) | [8,4](https://www.imdb.com/title/tt4633694/) | 90,5 / 9,1 | 11 |
| Vingadores: Guerra Infinita | [85%](https://www.rottentomatoes.com/m/avengers_infinity_war) | [8,4](https://www.imdb.com/title/tt4154756/) | 84,5 / 8,5 | 22 |
| Homem-Aranha: Através do Aranhaverso | [95%](https://www.rottentomatoes.com/m/spider_man_across_the_spider_verse) | [8,5](https://www.imdb.com/title/tt9362722/) | 90 / 9,0 | 15 |
| A Origem | [86%](https://www.rottentomatoes.com/m/inception) | [8,8](https://www.imdb.com/title/tt1375666/) | 87 / 8,7 | 19 |
| Cara de Um, Focinho de Outro | [94%](https://www.rottentomatoes.com/m/hoppers) | [7,2](https://www.imdb.com/title/tt26443616/) | 83 / 8,3 | 26 |
| Clube da Luta | [81%](https://www.rottentomatoes.com/m/fight_club) | [8,8](https://www.imdb.com/title/tt0137523/) | 84,5 / 8,5 | 23 |
| O Senhor dos Anéis: A Sociedade do Anel | [91%](https://www.rottentomatoes.com/m/the_lord_of_the_rings_the_fellowship_of_the_ring) | [8,9](https://www.imdb.com/title/tt0120737/) | 90 / 9,0 | 12 |
| Pulp Fiction: Tempo de Violência | [92%](https://www.rottentomatoes.com/m/pulp_fiction) | [8,8](https://www.imdb.com/title/tt0110912/) | 90 / 9,0 | 13 |
| Mortal Kombat 2 | [64%](https://www.rottentomatoes.com/m/mortal_kombat_ii) | [6,3](https://www.imdb.com/title/tt17490712/) | 63,5 / 6,4 | 531 |
| Robô Selvagem | [97%](https://www.rottentomatoes.com/m/the_wild_robot) | [8,1](https://www.imdb.com/title/tt29623480/) | 89 / 8,9 | 17 |
| A Viagem de Chihiro | [96%](https://www.rottentomatoes.com/m/spirited_away) | [8,6](https://www.imdb.com/title/tt0245429/) | 91 / 9,1 | 10 |
| À Espera de um Milagre | [78%](https://www.rottentomatoes.com/m/green_mile) | [8,6](https://www.imdb.com/title/tt0120689/) | 82 / 8,2 | 27 |
| Os Vingadores: The Avengers | [91%](https://www.rottentomatoes.com/m/marvels_the_avengers) | [8](https://www.imdb.com/title/tt0848228/) | 85,5 / 8,6 | 20 |
| Vingadores: Ultimato | [94%](https://www.rottentomatoes.com/m/avengers_endgame) | [8,4](https://www.imdb.com/title/tt4154796/) | 89 / 8,9 | 16 |
| Forrest Gump: O Contador de Histórias | [75%](https://www.rottentomatoes.com/m/forrest_gump) | [8,8](https://www.imdb.com/title/tt0109830/) | 81,5 / 8,2 | 28 |
| Maldição da Múmia | [45%](https://www.rottentomatoes.com/m/lee_cronins_the_mummy) | [6,1](https://www.imdb.com/title/tt32612507/) | 53 / 5,3 | 920 |
| Matrix | [83%](https://www.rottentomatoes.com/m/matrix) | [8,7](https://www.imdb.com/title/tt0133093/) | 85 / 8,5 | 21 |
| Os Bons Companheiros | [93%](https://www.rottentomatoes.com/m/goodfellas) | [8,7](https://www.imdb.com/title/tt0099685/) | 90 / 9,0 | 14 |
| Rick e Morty | [91%](https://www.rottentomatoes.com/tv/rick_and_morty) | [9](https://www.imdb.com/title/tt2861424/) | 90,5 / 9,1 | 13 |
| Família Soprano | [92%](https://www.rottentomatoes.com/tv/the_sopranos) | [9,2](https://www.imdb.com/title/tt0141842/) | 92 / 9,2 | 11 |
| Off Campus: Amores Improváveis | [92%](https://www.rottentomatoes.com/tv/off_campus) | [7,8](https://www.imdb.com/title/tt33546863/) | 85 / 8,5 | 44 |
| X-Men '97 | [98%](https://www.rottentomatoes.com/tv/x_men_97) | [8,7](https://www.imdb.com/title/tt16026746/) | 92,5 / 9,3 | 9 |
| Dr. House | [89%](https://www.rottentomatoes.com/tv/house) | [8,7](https://www.imdb.com/title/tt0412142/) | 88 / 8,8 | 18 |
| Origem | [96%](https://www.rottentomatoes.com/tv/from) | [7,8](https://www.imdb.com/title/tt9813792/) | 87 / 8,7 | 22 |
| Stranger Things | [90%](https://www.rottentomatoes.com/tv/stranger_things) | [8,6](https://www.imdb.com/title/tt4574334/) | 88 / 8,8 | 19 |
| The Office | [81%](https://www.rottentomatoes.com/tv/the_office) | [9](https://www.imdb.com/title/tt0386676/) | 85,5 / 8,6 | 43 |
| Friends | [78%](https://www.rottentomatoes.com/tv/friends) | [8,8](https://www.imdb.com/title/tt0108778/) | 83 / 8,3 | 70 |
| A Casa do Dragão | [88%](https://www.rottentomatoes.com/tv/house_of_the_dragon) | [8,3](https://www.imdb.com/title/tt11198330/) | 85,5 / 8,6 | 42 |
| Game of Thrones | [89%](https://www.rottentomatoes.com/tv/game_of_thrones) | [9,2](https://www.imdb.com/title/tt0944947/) | 90,5 / 9,1 | 14 |
| The Boys | [92%](https://www.rottentomatoes.com/tv/the_boys_2019) | [8,5](https://www.imdb.com/title/tt1190634/) | 88,5 / 8,9 | 17 |
| Futurama | [88%](https://www.rottentomatoes.com/tv/futurama) | [8,5](https://www.imdb.com/title/tt0149460/) | 86,5 / 8,7 | 30 |
| Rancho Dutton | [90%](https://www.rottentomatoes.com/tv/dutton_ranch) | [8,2](https://www.imdb.com/title/tt34991493/) | 86 / 8,6 | 31 |
| Yellowstone | [83%](https://www.rottentomatoes.com/tv/yellowstone) | [8,6](https://www.imdb.com/title/tt4236770/) | 84,5 / 8,5 | 56 |
| Xógum: A Gloriosa Saga do Japão | [99%](https://www.rottentomatoes.com/tv/shogun_2024) | [8,6](https://www.imdb.com/title/tt2788316/) | 92,5 / 9,3 | 10 |
| Ruptura | [95%](https://www.rottentomatoes.com/tv/severance) | [8,6](https://www.imdb.com/title/tt11280740/) | 90,5 / 9,1 | 15 |
| Toy Story 5 | [92%](https://www.rottentomatoes.com/m/toy_story_5) | [7,4](https://www.imdb.com/title/tt29355505/) | 83 / 8,3 | 25 |

## Cobertura mínima: Top 30 anteriores de cada tipo

Crítica/público/nota abaixo são os valores ANTERIORES, em 0–100.

| Tipo | # antes | Título | Crítica / público / SofáHype | Resultado |
|---|---:|---|---|---|
| filme | 1 | Avatar Aang: O Último Mestre do Ar | — / 93 / 92 | Revisão confirmada |
| filme | 2 | Devoradores de Estrelas | — / 87 / 89 | Revisão confirmada |
| filme | 3 | Como Mágica | — / 89 / 87 | Revisão confirmada |
| filme | 4 | Um Sonho de Liberdade | — / 87 / 87 | Revisão confirmada |
| filme | 5 | Interestelar | — / 85 / 85 | Revisão confirmada |
| filme | 6 | O Poderoso Chefão | — / 87 / 85 | Revisão confirmada |
| filme | 7 | O Justiceiro: Uma Última Morte | — / 83 / 84 | Revisão confirmada |
| filme | 8 | Batman: O Cavaleiro das Trevas | — / 85 / 84 | Revisão confirmada |
| filme | 9 | Homem-Aranha: No Aranhaverso | — / 84 / 84 | Revisão confirmada |
| filme | 10 | Vingadores: Guerra Infinita | — / 82 / 84 | Revisão confirmada |
| filme | 11 | Toy Story 5 | 93 / 74 / 84 | Revisão confirmada |
| filme | 12 | Homem-Aranha: Através do Aranhaverso | — / 83 / 83 | Revisão confirmada |
| filme | 13 | A Origem | — / 84 / 83 | Revisão confirmada |
| filme | 14 | O Senhor dos Anéis: O Retorno do Rei | — / 85 / 83 | Revisão confirmada |
| filme | 15 | Cara de Um, Focinho de Outro | — / 82 / 82 | Revisão confirmada |
| filme | 16 | Clube da Luta | — / 84 / 82 | Revisão confirmada |
| filme | 17 | O Senhor dos Anéis: A Sociedade do Anel | — / 84 / 82 | Revisão confirmada |
| filme | 18 | Parasita | — / 85 / 82 | Revisão confirmada |
| filme | 19 | O Poderoso Chefão: Parte II | — / 86 / 82 | Revisão confirmada |
| filme | 20 | Pulp Fiction: Tempo de Violência | — / 85 / 82 | Revisão confirmada |
| filme | 21 | Mortal Kombat 2 | — / 79 / 81 | Revisão confirmada |
| filme | 22 | Robô Selvagem | — / 83 / 81 | Revisão confirmada |
| filme | 23 | A Viagem de Chihiro | — / 85 / 81 | Revisão confirmada |
| filme | 24 | O Senhor dos Anéis: As Duas Torres | — / 84 / 81 | Revisão confirmada |
| filme | 25 | À Espera de um Milagre | — / 85 / 81 | Revisão confirmada |
| filme | 26 | Os Vingadores: The Avengers | — / 81 / 81 | Revisão confirmada |
| filme | 27 | Vingadores: Ultimato | — / 82 / 81 | Revisão confirmada |
| filme | 28 | Forrest Gump: O Contador de Histórias | — / 85 / 81 | Revisão confirmada |
| filme | 29 | Maldição da Múmia | — / 79 / 80 | Revisão confirmada |
| filme | 30 | Matrix | — / 83 / 80 | Revisão confirmada |
| serie | 1 | Aprendendo a Lição | — / 94 / 91 | Pendente; preservado |
| serie | 2 | Breaking Bad | — / 89 / 91 | Revisão confirmada |
| serie | 3 | Frieren e a Jornada para o Além | — / 88 / 89 | Revisão confirmada |
| serie | 4 | Rick e Morty | — / 87 / 89 | Revisão confirmada |
| serie | 5 | Apenas um Show | — / 86 / 89 | Pendente; preservado |
| serie | 6 | Família Soprano | — / 87 / 89 | Revisão confirmada |
| serie | 7 | Off Campus: Amores Improváveis | — / 89 / 88 | Revisão confirmada |
| serie | 8 | The Pitt | — / 87 / 88 | Revisão confirmada |
| serie | 9 | X-Men '97 | — / 87 / 88 | Revisão confirmada |
| serie | 10 | O Novato | — / 85 / 88 | Pendente; preservado |
| serie | 11 | Dr. House | — / 86 / 88 | Revisão confirmada |
| serie | 12 | Jujutsu Kaisen | — / 86 / 88 | Pendente; preservado |
| serie | 13 | Origem | — / 85 / 88 | Revisão confirmada |
| serie | 14 | Stranger Things | — / 86 / 88 | Revisão confirmada |
| serie | 15 | The Office | — / 86 / 88 | Revisão confirmada |
| serie | 16 | Chicago P.D.: Distrito 21 | — / 84 / 87 | Pendente; preservado |
| serie | 17 | The Good Doctor: O Bom Doutor | — / 85 / 87 | Pendente; preservado |
| serie | 18 | O Mentalista | — / 84 / 87 | Pendente; preservado |
| serie | 19 | Mushoku Tensei: Jobless Reincarnation | — / 85 / 87 | Pendente; preservado |
| serie | 20 | Friends | — / 84 / 87 | Revisão confirmada |
| serie | 21 | A Casa do Dragão | — / 84 / 87 | Revisão confirmada |
| serie | 22 | Game of Thrones | — / 85 / 87 | Revisão confirmada |
| serie | 23 | The Boys | — / 84 / 87 | Revisão confirmada |
| serie | 24 | Chicago Fire: Heróis Contra o Fogo | — / 84 / 87 | Pendente; preservado |
| serie | 25 | Bleach | — / 84 / 87 | Pendente; preservado |
| serie | 26 | Futurama | — / 84 / 87 | Revisão confirmada |
| serie | 27 | The Chosen: Os Escolhidos | — / 88 / 87 | Pendente; preservado |
| serie | 28 | Better Call Saul | — / 87 / 87 | Revisão confirmada |
| serie | 29 | Rancho Dutton | — / 92 / 86 | Revisão confirmada |
| serie | 30 | Yellowstone | — / 83 / 86 | Revisão confirmada |

## Pendências e exclusões

- Apenas um Show: [página geral do RT](https://www.rottentomatoes.com/tv/regular-show) sem Tomatometer geral publicado na consulta. Registro preservado, sem usar temporada ou público como substituto.
- O Novato: [página geral do RT](https://www.rottentomatoes.com/tv/the_rookie) sem Tomatometer geral publicado na consulta. Registro preservado, sem usar temporada ou público como substituto.
- Jujutsu Kaisen: [página geral do RT](https://www.rottentomatoes.com/tv/jujutsu_kaisen) sem Tomatometer geral publicado na consulta. Registro preservado, sem usar temporada ou público como substituto.
- Chicago P.D.: Distrito 21: [página geral do RT](https://www.rottentomatoes.com/tv/chicago_pd) sem Tomatometer geral publicado na consulta. Registro preservado, sem usar temporada ou público como substituto.
- The Good Doctor: O Bom Doutor: [página geral do RT](https://www.rottentomatoes.com/tv/the_good_doctor) sem Tomatometer geral publicado na consulta. Registro preservado, sem usar temporada ou público como substituto.
- O Mentalista: [página geral do RT](https://www.rottentomatoes.com/tv/the_mentalist) sem Tomatometer geral publicado na consulta. Registro preservado, sem usar temporada ou público como substituto.
- Mushoku Tensei: Jobless Reincarnation: [página geral do RT](https://www.rottentomatoes.com/tv/mushoku_tensei_jobless_reincarnation) sem Tomatometer geral publicado na consulta. Registro preservado, sem usar temporada ou público como substituto.
- Chicago Fire: Heróis Contra o Fogo: [página geral do RT](https://www.rottentomatoes.com/tv/chicago_fire) sem Tomatometer geral publicado na consulta. Registro preservado, sem usar temporada ou público como substituto.
- Bleach: [página geral do RT](https://www.rottentomatoes.com/tv/bleach) sem Tomatometer geral publicado na consulta. Registro preservado, sem usar temporada ou público como substituto.
- The Chosen: Os Escolhidos: [página geral do RT](https://www.rottentomatoes.com/tv/the_chosen) sem Tomatometer geral publicado na consulta. Registro preservado, sem usar temporada ou público como substituto.
- Bluey: [página geral do RT](https://www.rottentomatoes.com/tv/bluey) sem Tomatometer geral publicado na consulta. Registro preservado, sem usar temporada ou público como substituto.
- Hunter x Hunter: [página geral do RT](https://www.rottentomatoes.com/tv/hunter_x_hunter) sem Tomatometer geral publicado na consulta. Registro preservado, sem usar temporada ou público como substituto.
- Batman: A Série Animada: [página geral do RT](https://www.rottentomatoes.com/tv/batman_the_animated_series) sem Tomatometer geral publicado na consulta. Registro preservado, sem usar temporada ou público como substituto.
- Aprendendo a Lição: RT geral 90%, mas a pesquisa encontrou dois IDs do IMDb para a mesma série, com notas diferentes: [tt34809853, 8,4](https://www.imdb.com/title/tt34809853/) e [tt36261085, 8,5](https://www.imdb.com/title/tt36261085/). Registro preservado por falta de confirmação inequívoca.
- 12 Homens e uma Sentença: status_disponibilidade=sem_plataforma_monitorada, plataformas vazias. Excluído da disputa sem alterar disponibilidade e sem buscar nota para promover o título.

Além dos 60 primeiros, foram revisados os candidatos indicados que estavam fora do corte: Três Homens em Conflito, Toy Story (1995), Avatar (2005), Gravity Falls, A Escuta, INVENCÍVEL e Xógum. Também investigados Os Bons Companheiros, Ruptura, Bluey, Hunter x Hunter e Batman: A Série Animada.

## Validações locais

- Validação normal: 2.444 títulos, zero erros, zero avisos.
- Validação strict: 2.444 títulos, zero erros, zero avisos.
- Build de produção: concluído.
- node --test scripts/ranking.test.mjs: seis testes aprovados.
- Autoteste de scripts/streaming-providers.mjs: aprovado. Não existia suíte de smoke tests no repositório.
- HTTP na primeira rodada: 66 rotas retornaram 200, incluindo as 57 páginas então revisadas, Home, /filmes, /series, /streamings/netflix, buscas e os três destaques. Título inexistente retornou 404.
- Busca com e sem resultado e Vacilei: confirmados no navegador; o primeiro teste HTTP buscava texto em caixa alta, mas o HTML usa Vacilei! e o CSS transforma a exibição. Falha do teste, sem defeito da página.
- Home desktop (1440×1000): 16 cards, ordem correta, todos os posters carregados; sem overflow horizontal.
- Home mobile (390×844): 16 cards e todos os posters carregados. A regra CSS preexistente esconde a coluna de notas do ranking no mobile; preservada.
- Card de O Poderoso Chefão abre a página correta, com nota 9.5 e Sofá Galático.
- Carousel: estrutura, ordem, textos, imagens, comportamento e demais dados editoriais preservados. Apenas as notas autorizadas de Toy Story 5 foram sincronizadas com o catálogo: crítica 92, público 74, SofáHype 83 (exibição 9.2 / 7.4 / 8.3).
- Comparação estrutural do JSON: apenas os três campos de notas foram alterados nos 58 registros revisados.

## Publicação

Commit, push da branch e abertura do PR autorizados. Este relatório registra a validação local anterior ao commit. Checks GitHub/Netlify, SHA detectado e inspeção do Deploy Preview serão informados no PR e na entrega. Não fazer merge.
