// Floating frosted bottom sheet with a grab handle. Sits above a full-bleed map.
export default function Sheet({ children, className = "" }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-[600] p-3">
      <div
        className={`glass animate-fade-up rounded-[1.6rem] p-4 shadow-card ring-1 ring-white/50 ${className}`}
      >
        <div className="sheet-handle" />
        {children}
      </div>
    </div>
  );
}
