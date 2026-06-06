const VARIANTS = {
  primary:
    "bg-taxi text-volcanic hover:bg-taxi-dark active:scale-[0.98] shadow-card",
  dark: "bg-volcanic text-cream hover:bg-volcanic-800 active:scale-[0.98]",
  sea: "bg-atlantic text-white hover:bg-atlantic-dark active:scale-[0.98]",
  ghost: "bg-transparent text-volcanic hover:bg-sand-deep/50",
  outline:
    "bg-transparent text-volcanic border-2 border-volcanic/15 hover:border-volcanic/40",
  danger: "bg-coral text-white hover:brightness-95 active:scale-[0.98]",
};

const SIZES = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-3 text-[0.95rem]",
  lg: "px-5 py-4 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  full = false,
  className = "",
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold
        transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none
        ${VARIANTS[variant]} ${SIZES[size]} ${full ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
