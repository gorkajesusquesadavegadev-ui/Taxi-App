// Bloque de carga con shimmer. Reemplaza spinners pelados por placeholders
// que imitan el contenido real (sensación premium, menos "salto").
export function Skeleton({ className = "" }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

/** Tarjeta-esqueleto que imita una fila de lista (viaje, usuario, reserva). */
export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-sand-deep bg-white p-4 shadow-card">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-5 w-14" />
      </div>
      <Skeleton className="mt-3 h-3 w-3/4" />
    </div>
  );
}

/** Lista de tarjetas-esqueleto. */
export function SkeletonList({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
