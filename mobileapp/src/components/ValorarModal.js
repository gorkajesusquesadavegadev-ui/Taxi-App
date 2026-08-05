// Valoración 1-5★ tras viaje completado. Espejo de components/ValorarViaje.jsx.
import { useState } from "react";
import { Modal, View, Text, Pressable, Linking } from "react-native";
import { api } from "../api/client";
import { useI18n } from "../i18n";
import { Btn, Input, Card } from "./UI";

// Ficha de Google del negocio. Cuando se tenga el enlace corto oficial del
// panel de Google Business Profile (https://g.page/r/.../review), cambiarlo aquí.
const GOOGLE_REVIEW_URL = "https://www.google.com/search?q=Canarycab&kgmid=/g/11z9504nhj";

export default function ValorarModal({ viajeId, quien = "trip", onClose }) {
  const { t } = useI18n();
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [busy, setBusy] = useState(false);
  const [enviado, setEnviado] = useState(false);
  // Solo se invita a reseñar Google cuando es el CLIENTE valorando el viaje
  // (quien === "trip"); si es el taxista valorando al pasajero no tiene sentido.
  const invitarGoogle = quien === "trip";

  async function enviar() {
    if (estrellas < 1) return;
    setBusy(true);
    try {
      await api.valorar(viajeId, estrellas, comentario.trim() || null);
    } catch (_) { /* ya valorado → ocultar igual */ }
    setEnviado(true);
    // Con invitación a reseña no se autocierra: hay que darle tiempo a pulsarla.
    if (!invitarGoogle) setTimeout(onClose, 1200);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 justify-center bg-volcanic/60 p-5">
        <Card className="py-6">
          {enviado ? (
            <View className="py-4">
              <Text className="text-center font-display text-lg text-volcanic">⭐ {t("rate.thanks")}</Text>
              {invitarGoogle && (
                <>
                  {/* Se ofrece a todo el que valora, sin mirar las estrellas:
                      pedir reseña solo a los contentos ("review gating")
                      incumple las políticas de Google. */}
                  <Pressable
                    className="mt-4 items-center rounded-xl border-2 border-volcanic/15 bg-white py-2.5 active:scale-95"
                    onPress={() => Linking.openURL(GOOGLE_REVIEW_URL)}
                  >
                    <Text className="font-bodybold text-[14px] text-volcanic">★ {t("rate.googleCta")}</Text>
                  </Pressable>
                  <Text className="mt-1.5 text-center font-bodymed text-[11px] text-volcanic/45">
                    {t("rate.googleNote")}
                  </Text>
                  <Pressable className="mt-3 items-center py-1.5" onPress={onClose}>
                    <Text className="font-bodybold text-[13px] text-volcanic/50">{t("common.close")}</Text>
                  </Pressable>
                </>
              )}
            </View>
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
