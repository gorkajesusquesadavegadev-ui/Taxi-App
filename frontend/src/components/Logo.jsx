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

/* Splash — wordmark grande centrado */
export function LogoFull({ className = "" }) {
  return (
    <img
      src={LOGO_SRC}
      alt="CanaryCab"
      className={`w-64 sm:w-72 ${className}`}
      style={{ objectFit: "contain" }}
    />
  );
}
