// Floating frosted panel above a full-bleed map.
// Mobile: bottom sheet with grab handle. Desktop: floating card pinned bottom-right.
export default function Sheet({ children, className = "" }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-[600] p-3 lg:left-auto lg:right-6 lg:bottom-6 lg:w-[26rem] lg:p-0">
      <div
        className={`glass animate-fade-up rounded-[1.6rem] p-4 shadow-float ring-1 ring-white/50 lg:p-5 ${className}`}
      >
        <div className="sheet-handle lg:hidden" />
        {children}
      </div>
    </div>
  );
}
