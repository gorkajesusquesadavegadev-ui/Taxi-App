export default function Input({ label, hint, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <label htmlFor={inputId} className="block">
      {label && (
        <span className="mb-1.5 block text-sm font-semibold text-volcanic/80">
          {label}
        </span>
      )}
      <input
        id={inputId}
        className={`w-full rounded-2xl border-2 border-sand-deep bg-cream px-4 py-3 text-volcanic
          placeholder:text-volcanic/35 outline-none transition-colors
          focus:border-taxi focus:bg-white focus:shadow-glow ${className}`}
        {...props}
      />
      {hint && <span className="mt-1 block text-xs text-volcanic/50">{hint}</span>}
    </label>
  );
}
