const iconByVariant = {
  galatico: '/assets/sofa-galatico.png',
  quente: '/assets/sofa-quente.png',
  ok: '/assets/sofa-ok.png',
  frio: '/assets/sofa-fraco.png'
};

export default function HypometroIcon({ variant = 'ok', size = 32, label = '' }) {
  const src = iconByVariant[variant] || iconByVariant.ok;

  return (
    <span
      className={`hypo-icon ${variant}`}
      style={{ width: size, height: size }}
      aria-hidden={!label}
      aria-label={label || undefined}
    >
      <img src={src} alt="" />
    </span>
  );
}
