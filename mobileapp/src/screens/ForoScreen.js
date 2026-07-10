// Foro de taxistas — espejo de Foro.jsx (historial + WS forum:message).
import { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { api } from "../api/client";
import { connectWs } from "../api/ws";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { Btn, Input } from "../components/UI";

function fmtHora(iso, lang, t) {
  try {
    const d = new Date(iso);
    const hoy = new Date();
    const esHoy = d.toDateString() === hoy.toDateString();
    const ayer = new Date(hoy.getTime() - 86400000);
    const esAyer = d.toDateString() === ayer.toDateString();
    const hora = d.toLocaleTimeString(lang === "en" ? "en-GB" : lang === "de" ? "de-DE" : "es-ES",
      { hour: "2-digit", minute: "2-digit" });
    if (esHoy) return `${t("forum.today")} ${hora}`;
    if (esAyer) return `${t("forum.yesterday")} ${hora}`;
    return `${d.toLocaleDateString()} ${hora}`;
  } catch { return ""; }
}

export default function ForoScreen() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    api.foroHistorial().then((m) => setMensajes(m || [])).catch(() => setError(t("forum.couldNotLoad")));
    const ws = connectWs((event, data) => {
      if (event !== "forum:message" || !data) return;
      setMensajes((ms) => (ms.some((x) => x.id === data.id) ? ms : [...ms, data]));
    });
    return () => ws.close();
  }, []);

  async function enviar() {
    const txt = texto.trim();
    if (!txt) return;
    setBusy(true); setError("");
    try {
      const m = await api.foroPublicar(txt);
      if (m) setMensajes((ms) => (ms.some((x) => x.id === m.id) ? ms : [...ms, m]));
      setTexto("");
    } catch (e) {
      setError(e.message || t("forum.couldNotSend"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-cream pt-14" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text className="mb-1 px-4 font-display text-[19px] text-volcanic">💬 {t("forum.title")}</Text>
      <FlatList
        ref={listRef}
        data={mensajes}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ padding: 14, paddingBottom: 10 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <Text className="mt-10 text-center font-bodysemi text-volcanic/50">
            {t("forum.empty")} {t("forum.beFirst")}
          </Text>
        }
        renderItem={({ item: m }) => {
          const mio = m.autorId === user?.id;
          return (
            <View
              className={`mb-2 max-w-[82%] rounded-2xl p-2.5 ${
                mio ? "self-end bg-taxi" : "self-start border border-sand-deep bg-white"
              }`}
            >
              {!mio && <Text className="mb-0.5 font-bodybold text-[11px] text-atlantic-dark">{m.autorNombre}</Text>}
              <Text className="font-body text-[14px] text-volcanic">{m.texto}</Text>
              <Text className="mt-1 self-end font-body text-[10px] text-volcanic/40">{fmtHora(m.creadoEn, lang, t)}</Text>
            </View>
          );
        }}
      />
      {error ? <Text className="px-4 font-bodybold text-[13px] text-coral">{error}</Text> : null}
      <View className="flex-row items-end gap-2 border-t border-sand-deep bg-white p-3">
        <Input placeholder={t("forum.writePh")} value={texto} onChangeText={setTexto} className="flex-1" multiline />
        <Btn title="➤" onPress={enviar} busy={busy} disabled={!texto.trim()} className="px-4 py-3" />
      </View>
    </KeyboardAvoidingView>
  );
}
