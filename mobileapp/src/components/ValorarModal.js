// Valoración 1-5★ tras viaje completado. Espejo de components/ValorarViaje.jsx.
import { useState } from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { api } from "../api/client";
import { useI18n } from "../i18n";
import { Btn, Input, Card } from "./UI";

export default function ValorarModal({ viajeId, quien = "trip", onClose }) {
  const { t } = useI18n();
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [busy, setBusy] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function enviar() {
    if (estrellas < 1) return;
    setBusy(true);
    try {
      await api.valorar(viajeId, estrellas, comentario.trim() || null);
    } catch (_) { /* ya valorado → ocultar igual */ }
    setEnviado(true);
    setTimeout(onClose, 1200);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center bg-volcanic/60 p-5">
        <Card className="py-6">
          {enviado ? (
            <Text className="py-5 text-center font-display text-lg text-volcanic">⭐ {t("rate.thanks")}</Text>
          ) : (
            <>
              <Text className="text-center font-display text-[17px] text-volcanic">
                {t("rate.howWas")} {quien === "client" ? t("rate.theClient") : t("rate.theTrip")}
              </Text>
              <View className="mt-3.5 flex-row justify-center gap-2.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Pressable key={n} onPress={() => setEstrellas(n)} hitSlop={8}>
                    <Text className={`text-[40px] ${n <= estrellas ? "text-taxi" : "text-sand-deep"}`}>★</Text>
                  </Pressable>
                ))}
              </View>
              <Input
                placeholder={t("rate.commentPh")}
                value={comentario}
                onChangeText={setComentario}
                multiline
                className="mt-3 min-h-[60px]"
              />
              <View className="mt-3.5 flex-row gap-2.5">
                <Btn title={t("common.close")} kind="ghost" className="flex-1" onPress={onClose} />
                <Btn title={t("rate.send")} className="flex-[2]" onPress={enviar} busy={busy} disabled={estrellas < 1} />
              </View>
            </>
          )}
        </Card>
      </View>
    </Modal>
  );
}
