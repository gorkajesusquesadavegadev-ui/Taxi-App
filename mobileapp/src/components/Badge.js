// Pill de estado de viaje — espejo de components/Badge.jsx (web).
import { View, Text } from "react-native";
import { useI18n } from "../i18n";

const STYLES = {
  SOLICITADO: { box: "bg-taxi-soft", txt: "text-volcanic", dot: "bg-volcanic" },
  ACEPTADO: { box: "bg-atlantic/15", txt: "text-atlantic-dark", dot: "bg-atlantic-dark" },
  LLEGADO: { box: "bg-palm/15", txt: "text-palm", dot: "bg-palm" },
  EN_CURSO: { box: "bg-atlantic", txt: "text-white", dot: "bg-white" },
  COMPLETADO: { box: "bg-palm", txt: "text-white", dot: "bg-white" },
  CANCELADO: { box: "bg-coral/15", txt: "text-coral", dot: "bg-coral" },
};

export default function Badge({ estado, label }) {
  const { t } = useI18n();
  const s = STYLES[estado] || { box: "bg-volcanic/10", txt: "text-volcanic/70", dot: "bg-volcanic/70" };
  return (
    <View className={`flex-row items-center gap-1.5 self-start rounded-full px-3 py-1.5 ${s.box}`}>
      <View className={`h-1.5 w-1.5 rounded-full opacity-70 ${s.dot}`} />
      <Text className={`font-bodybold text-[12px] ${s.txt}`}>{label || t(`badge.${estado}`)}</Text>
    </View>
  );
}
