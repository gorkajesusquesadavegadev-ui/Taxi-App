export default function Spinner({ className = "" }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-volcanic/20 border-t-taxi ${className}`}
      role="status"
      aria-label="cargando"
    />
  );
}
