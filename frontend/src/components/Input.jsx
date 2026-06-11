// Text input with live validation states: `error` (message) or `ok` (boolean).
// Strict 3-hue palette: errors speak in ink + motion, success in Atlantic blue.

const IconCheck = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-pop">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const IconAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="animate-pop">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.4v.1" />
  </svg>
);

export default function Input({ label, hint, error, ok, className = "", id, ...props }) {
  const inputId = id || props.name;
  const border = error
    ? "border-volcanic/75 bg-volcanic/[0.04] focus:border-volcanic"
    : ok
      ? "border-atlantic/75 bg-atlantic/[0.05] focus:border-atlantic"
      : "border-sand-deep bg-cream focus:border-taxi focus:bg-white focus:shadow-glow";
  return (
    <label htmlFor={inputId} className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-semibold text-volcanic/80">{label}</span>
      )}
      <span className="relative block">
        <input
          id={inputId}
          className={`w-full rounded-2xl border-2 px-4 py-3 text-volcanic outline-none transition-all
            placeholder:text-volcanic/35 ${error || ok ? "pr-11" : ""} ${border} ${className}`}
          {...props}
        />
        {(error || ok) && (
          <span
            className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2
              ${error ? "text-volcanic/80" : "text-atlantic"}`}
          >
            {error ? <IconAlert /> : <IconCheck />}
          </span>
        )}
      </span>
      {error ? (
        <span className="mt-1.5 block animate-fade-up text-xs font-semibold text-volcanic/75">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-volcanic/50">{hint}</span>
      ) : null}
    </label>
  );
}
