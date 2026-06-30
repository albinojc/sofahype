export default function SearchBox({ defaultQuery = '', defaultTipo = 'todos', variant = 'page', placeholder = 'Buscar filme ou série...' }) {
  return (
    <form className={`search-form search-form-${variant}`} action="/buscar" role="search">
      <input
        type="search"
        name="q"
        defaultValue={defaultQuery}
        placeholder={placeholder}
        aria-label="Buscar filme ou série"
      />
      {defaultTipo && defaultTipo !== 'todos' ? <input type="hidden" name="tipo" value={defaultTipo} /> : null}
      <button className="search-submit" type="submit">Buscar</button>
    </form>
  );
}
