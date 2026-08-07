# Instruções para o Codex — SofáHype

- Leia `SOFAHYPE_CONTEXT.md` antes de qualquer mudança relevante.
- Preserve a identidade, a linguagem popular e brasileira e as regras editoriais do SofáHype. Prefira recomendações conservadoras e confiáveis.
- Considere `6.0` como o início da faixa **Sofá OK** e escreva sempre **Sofá Galático**.
- Use **Max** como nome editorial da plataforma, salvo quando o código exigir temporariamente outro identificador interno.
- Nunca exponha tokens, chaves, credenciais ou outros segredos no código, em logs, commits ou conversas.
- Nunca invente ou estime notas de IMDb, Rotten Tomatoes ou Nota SofáHype. Se ainda não houver avaliações suficientes ou consolidadas, mantenha a atração sem nota e indique que as notas serão atualizadas posteriormente.
- Em atualizações do Destaque da Semana, verifique `src/data/weeklyHighlight.js`, `src/data/catalogo.json` e as imagens em `public/assets`.
- Nunca publique um destaque cujo `slug` não exista no catálogo.
- Antes de considerar um Destaque da Semana pronto, confirme que o botão ou link do destaque abre corretamente a página individual do título e nunca direciona para a página “Vacilei”.
- Verifique se `poster_url` e `backdrop_url` apontam para imagens válidas.
- Garanta que apenas o título correto tenha `destaque_semana: true`.
- Execute os testes e o build disponíveis antes de considerar uma alteração pronta.
- Revise o diff final, preserve mudanças existentes do usuário e evite alterações não relacionadas.
- Não faça commit, push nem envie alterações ao GitHub sem autorização explícita do usuário.
