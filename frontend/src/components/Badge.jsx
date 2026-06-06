// Maps a trip estado to a colored pill.
const STYLES = {
  SOLICITADO: "bg-taxi-soft text-volcanic",
  ACEPTADO: "bg-atlantic/15 text-atlantic-dark",
  LLEGADO: "bg-palm/15 text-palm",
  EN_CURSO: "bg-atlantic text-white",
  COMPLETADO: "bg-palm text-white",
  CANCELADO: "bg-coral/15 text-coral",
  LIBRE: "bg-palm/15 text-palm",
  OCUPADO: "bg-coral/15 text-coral",
  DESCONECTADO: "bg-volcanic/10 text-volcanic/60",
};

const LABELS = {
  SOLICITADO: "Buscando taxi",
  ACEPTADO: "Taxi en camino",
  LLEGADO: "Taxi ha llegado",
  EN_CURSO: "En viaje",
  COMPLETADO: "Completado",
  CANCELADO: "Cancelado",
};

export default function Badge({ estado, label, className = "" }) {
  const style = STYLES[estado] || "bg-volcanic/10 text-volcanic/70";
  return (
    <span className={`pill ${style} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {label || LABELS[estado] || estado}
    </span>
  );
}
