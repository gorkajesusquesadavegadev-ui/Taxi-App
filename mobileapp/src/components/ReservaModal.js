// Programar reserva: fecha/hora + notas → onConfirm({ programadaPara(ISO), notas }).
import { useState } from "react";
import { Modal, View, Text } from "react-native";
import { useI18n } from "../i18n";
import { Btn, Input, Card } from "./UI";

function enUnaHora() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  return d;
}
const pad = (n) => String(n).padStart(2, "0");
const fmtFecha = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtHora = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function ReservaModal({ titulo, onConfirm, onClose }) {
  const { t } = useI18n();
  const inicial = enUnaHora();
  const [fecha, setFecha] = useState(fmtFecha(inicial));
  const [hora, setHora] = useState(fmtHora(inicial));
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function sumar(horas) {
    const d = new Date(`${fecha}T${hora}:00`);
    const base = isNaN(d.getTime()) ? enUnaHora() : d;
    const n = new Date(base.getTime() + horas * 3600 * 1000);
    setFecha(fmtFecha(n));
    setHora(fmtHora(n));
  }

  async function confirmar() {
    setError("");
    const d = new Date(`${fecha}T${hora}:00`);
    if (isNaN(d.getTime())) { setError(t("rm.pickDatetime")); return; }
    if (d <= new Date()) { setError(t("rm.futureDate")); return; }
    setBusy(true);
    try {
      await onConfirm({ programadaPara: d.toISOString(), notas: notas.trim() || null });
    } catch (e) {
      setError(e.message || t("rm.couldNotBook"));
      setBusy(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-volcanic/60 p-3.5">
        <Card className="pb-6">
          <Text className="font-display text-[16px] text-volcanic">{titulo}</Text>
          <Text className="mb-1.5 mt-3 font-bodybold text-[11px] uppercase tracking-wider text-volcanic/50">
            {t("rm.datetime")}
          </Text>
          <View className="flex-row gap-2">
            <Input value={fecha} onChangeText={setFecha} placeholder="2026-07-15" className="flex-[3]" />
            <Input value={hora} onChangeText={setHora} placeholder="18:30" className="flex-[2]" />
          </View>
          <View className="mt-2 flex-row gap-2">
            <Btn title="+1h" kind="ghost" className="flex-1 py-2" onPress={() => sumar(1)} />
            <Btn title="+3h" kind="ghost" className="flex-1 py-2" onPress={() => sumar(3)} />
            <Btn title="+24h" kind="ghost" className="flex-1 py-2" onPress={() => sumar(24)} />
          </View>
          <Text className="mb-1.5 mt-3 font-bodybold text-[11px] uppercase tracking-wider text-volcanic/50">
            {t("rm.notes")}
          </Text>
          <Input placeholder={t("rm.notesPh")} value={notas} onChangeText={setNotas} multiline className="min-h-[56px]" />
          {error ? <Text className="mt-2.5 font-bodybold text-[13px] text-coral">{error}</Text> : null}
          <View className="mt-4 flex-row gap-2.5">
            <Btn title={t("common.cancel")} kind="ghost" className="flex-1" onPress={onClose} />
            <Btn title={t("rm.confirm")} className="flex-[2]" onPress={confirmar} busy={busy} />
          </View>
        </Card>
      </View>
    </Modal>
  );
}
