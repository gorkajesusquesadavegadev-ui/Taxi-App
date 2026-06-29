const LOGO_SRC = "/canarycab-logo.png";

/* Wordmark — para sidebar y brand chip (horizontal) */
export function LogoWordmark({ height = 32, className = "" }) {
  return (
    <img
      src={LOGO_SRC}
      alt="CanaryCab"
      height={height}
      className={className}
      style={{ height, width: "auto", objectFit: "contain" }}
    />
  );
}

/* Alias para compatibilidad con imports anteriores */
export function LogoIcon({ size = 40, className = "" }) {
  return <LogoWordmark height={size} className={className} />;
}

/* Splash — wordmark grande centrado con subtítulo editable */
export function LogoFull({ className = "", subtitle = "Tu app de taxis de Canarias" }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <p className="font-display text-4xl font-black tracking-tight text-volcanic sm:text-5xl">
        CanaryCab
      </p>
      <p className="font-sans text-[11px] font-bold uppercase tracking-[0.22em] text-volcanic/50">
        {subtitle}
      </p>
    </div>
  );
}
