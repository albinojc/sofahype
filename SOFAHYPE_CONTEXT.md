# SofáHype — Contexto do Projeto

## O que é o SofáHype

SofáHype é o guia brasileiro para decidir o que assistir.

A dor principal do usuário é: quero assistir algo bom nos streamings, mas não quero perder tempo zapeando entre várias plataformas até decidir.

O SofáHype deve funcionar como uma dica confiável de um amigo: simples, direta, humana e útil.

## Posicionamento

O SofáHype não é apenas um site de notas.

Ele deve ajudar o usuário a responder rapidamente:

* Onde assistir?
* É bem avaliado?
* Que tipo de experiência essa atração entrega?
* Combina com o que eu estou procurando?

## Estrutura técnica

* Site em Next.js.
* Repositório GitHub: albinojc/sofahype.
* Deploy automático pelo Netlify.
* Domínio: sofahype.com.br.
* Token TMDb salvo no Netlify como variável de ambiente: TMDB_READ_ACCESS_TOKEN.
* Nunca expor o token TMDb no chat nem no código.

## Arquivos importantes

* src/data/catalogo.json — catálogo de filmes e séries.
* src/data/weeklyHighlight.js — destaque da semana.
* src/components/WeeklyHighlight.js — componente do destaque.
* src/app/page.js — home.
* src/app/buscar/page.js — página de busca.
* src/app/filmes/page.js — página de filmes.
* src/app/series/page.js — página de séries.
* src/app/streamings/[slug]/page.js — páginas dos streamings.
* src/app/titulo/[slug]/page.js — página individual da atração.
* scripts/import-tmdb.mjs — importador do TMDb.
* public/assets — logo, sofás do Hypômetro e sofá da página “Vacilei”.

## Linguagem

Usar linguagem popular, acessível e brasileira.

Evitar termos com cara de crítica especializada, como:

* contemplativo;
* realismo cotidiano;
* ficção escapista;
* cinema sensorial;
* estudo de personagem;
* linguagem formal demais.

Preferir termos claros, como:

* história mais calma;
* história pesada;
* filme para prestar atenção;
* bom para relaxar;
* não é para ver distraído;
* clima tenso;
* humor ácido;
* história fora da ordem.

## Nota SofáHype

A nota deve ser exibida de 0.0 a 10.0.

Não usar porcentagem como nota principal.

A nota precisa aparecer em box, com destaque visual.

Faixas:

* 9.0 a 10.0 — roxo — Sofá Galático.
* 7.5 a 8.9 — vermelho — Sofá Quente.
* 6.0 a 7.4 — amarelo ouro — Sofá OK.
* abaixo de 6.0 — ciano — Sofá Fraco.

Usar sempre “Galático”, nunca “Galáctico”.

## Hypômetro

O Hypômetro usa ícones próprios de sofá:

* sofá roxo: Sofá Galático;
* sofá vermelho: Sofá Quente;
* sofá amarelo: Sofá OK;
* sofá ciano: Sofá Fraco.

Não usar emoji de fogo, pimenta, floco de neve ou símbolos genéricos.

## Busca

A busca deve ter botão “Buscar”.

Ao buscar, levar para:

/buscar?q=termo

Se não houver resultado, mostrar o sofá verde “Vacilei” com o texto:

VACILEI!
Parece que ainda não temos o título que você tava procurando. Mas olha só, a gente vai correr pra deixar seu sofá preferido cada vez mais do seu jeito!

O botão deve ter apenas o texto:

Voltar

## Onde assistir

Na página individual da atração, o bloco “Onde assistir” deve aparecer com destaque antes das notas.

Ordem ideal da página individual:

1. Título, cartaz e informações principais.
2. Onde assistir.
3. Nota SofáHype.
4. Hypômetro.
5. Crítica e público.
6. Como é a experiência?
7. Ideal para quem gosta de.
8. Talvez não seja para você se procura.

## Streamings

Usar “Apple TV”, sem “+”.

Streamings principais:

* Netflix
* Prime Video
* Max
* Disney+
* Globoplay
* Apple TV
* Paramount+
* Hulu

## Curadoria por sensação

A seção “Escolha por sensação” deve ser rigorosa.

Melhor mostrar poucos títulos certos do que muitas sugestões duvidosas.

Exemplo: “Quero me assustar” não pode mostrar filme de família, aventura leve, animação infantil, romance ou comédia apenas porque tem algum mistério.

A curadoria deve preservar a confiança.

## Destaque da semana

O destaque da semana deve ser atualizado no arquivo:

src/data/weeklyHighlight.js

Ele deve ter:

* label;
* título;
* slug;
* plataforma;
* chamada;
* nota;
* Hypômetro;
* crítica SofáHype;
* experiência;
* ideal para quem gosta de;
* talvez não seja para você se procura.

A crítica deve parecer uma indicação de amigo bem informado: acessível, humana, espontânea e sem cinemês.

Não usar a frase:

“Curadoria SofáHype baseada em críticas publicadas e recepção do público.”

Essa frase deve ser evitada porque enfraquece a credibilidade editorial.

## Fluxo de atualização semanal

Para cada atualização semanal:

1. Atualizar src/data/weeklyHighlight.js.
2. Confirmar se o título está no catálogo.
3. Se não estiver, adicionar manualmente em src/data/catalogo.json ou ajustar o importador.
4. Fazer commit no GitHub.
5. Aguardar deploy automático no Netlify.
6. Testar home, busca, página do título e página do streaming.

## Princípio editorial

O SofáHype deve ser confiável.

Se não houver certeza sobre a experiência da atração, é melhor dizer menos do que dizer errado.

A prioridade é não quebrar a confiança do usuário.
