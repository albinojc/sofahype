import Link from 'next/link';

export default function SearchEmptyState({ className = '' }) {
  return (
    <div className={`empty-search-state ${className}`.trim()}>
      <img src="/assets/sofa-vacilei.png" alt="SofáHype ainda não encontrou esse título" />
      <div>
        <h2>Vacilei!</h2>
        <p>
          Parece que ainda não temos o título que você tava procurando. Mas olha só, a gente vai correr pra deixar seu sofá preferido cada vez mais do seu jeito!
        </p>
        <Link className="btn-ver-todos" href="/">Voltar</Link>
      </div>
    </div>
  );
}
