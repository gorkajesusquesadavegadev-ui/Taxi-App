import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout.jsx";
import Spinner from "../components/Spinner.jsx";
import { IconChat, IconSend } from "../components/icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { connectWs } from "../api/ws.js";

const fmtHora = (iso) =>
  new Date(iso).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

const fmtDia = (iso) => {
  const d = new Date(iso);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);
  if (d.toDateString() === hoy.toDateString()) return "Hoy";
  if (d.toDateString() === ayer.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long" });
};

// color estable por autor para el nombre (paleta dentro de la marca)
const NOMBRE_COLORES = ["#0B5C9E", "#1577C2", "#E8AF00", "#0B2E4F", "#4AA3DD"];
const colorDe = (id) => NOMBRE_COLORES[Number(id) % NOMBRE_COLORES.length];

function Burbuja({ m, propio, mostrarAutor }) {
  return (
    <div className={`flex ${propio ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[65%] ${
          propio
            ? "rounded-br-md bg-taxi text-volcanic"
            : "rounded-bl-md bg-white text-volcanic ring-1 ring-sand-deep/50"
        }`}
      >
        {!propio && mostrarAutor && (
          <p className="mb-0.5 text-xs font-extrabold" style={{ color: colorDe(m.autorId) }}>
            {m.autorNombre}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words text-sm leading-snug">{m.texto}</p>
        <p className={`mt-0.5 text-right text-[10px] ${propio ? "text-volcanic/55" : "text-volcanic/40"}`}>
          {fmtHora(m.creadoEn)}
        </p>
      </div>
    </div>
  );
}

function Separador({ texto }) {
  return (
    <div className="my-2 flex justify-center">
      <span className="rounded-full bg-volcanic/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-volcanic/55">
        {texto}
      </span>
    </div>
  );
}

export default function Foro() {
  const { user } = useAuth();
  const [mensajes, setMensajes] = useState(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const finRef = useRef(null);
  const idsRef = useRef(new Set()); // dedupe: el autor recibe su propio mensaje por WS

  const scrollAbajo = () =>
    requestAnimationFrame(() => finRef.current?.scrollIntoView({ behavior: "smooth" }));

  // historial inicial
  useEffect(() => {
    let alive = true;
    api
      .foroHistorial()
      .then((lista) => {
        if (!alive) return;
        idsRef.current = new Set(lista.map((m) => m.id));
        setMensajes(lista);
        scrollAbajo();
      })
      .catch((e) => alive && setError(e.message || "No se pudo cargar el foro"));
    return () => {
      alive = false;
    };
  }, []);

  // tiempo real: nuevos mensajes por WebSocket
  useEffect(() => {
    const ws = connectWs((event, data) => {
      if (event !== "forum:message" || !data) return;
      if (idsRef.current.has(data.id)) return;
      idsRef.current.add(data.id);
      setMensajes((prev) => [...(prev || []), data]);
      scrollAbajo();
    });
    return () => ws.close();
  }, []);

  async function enviar(e) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    setError("");
    try {
      const m = await api.foroPublicar(t);
      setTexto("");
      if (m && !idsRef.current.has(m.id)) {
        idsRef.current.add(m.id);
        setMensajes((prev) => [...(prev || []), m]);
        scrollAbajo();
      }
    } catch (err) {
      setError(err.message || "No se pudo enviar");
    } finally {
      setEnviando(false);
    }
  }

  let ultimoDia = null;

  return (
    <Layout title="Foro de taxistas" framed>
      <div className="flex h-full flex-col">
        {/* lista de mensajes */}
        <div className="slim-scroll flex-1 overflow-y-auto overflow-x-hidden bg-cream px-3 py-4 sm:px-6">
          <div className="mx-auto max-w-2xl space-y-1.5">
            {!mensajes && !error && (
              <div className="grid place-items-center py-16">
                <Spinner />
              </div>
            )}
            {error && (
              <p className="rounded-2xl bg-coral/12 p-4 text-center text-sm text-coral">{error}</p>
            )}
            {mensajes && mensajes.length === 0 && (
              <div className="grid place-items-center py-16 text-center">
                <span className="mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-atlantic/10 text-atlantic-dark">
                  <IconChat width={30} height={30} />
                </span>
                <p className="font-display text-lg font-bold">Foro vacío</p>
                <p className="text-sm text-volcanic/55">Sé el primero en escribir a tus compañeros.</p>
              </div>
            )}
            {mensajes?.map((m, i) => {
              const propio = Number(m.autorId) === Number(user?.id);
              const prev = mensajes[i - 1];
              const dia = fmtDia(m.creadoEn);
              const nuevoDia = dia !== ultimoDia;
              ultimoDia = dia;
              const mostrarAutor = !prev || prev.autorId !== m.autorId || nuevoDia;
              return (
                <div key={m.id}>
                  {nuevoDia && <Separador texto={dia} />}
                  <Burbuja m={m} propio={propio} mostrarAutor={mostrarAutor} />
                </div>
              );
            })}
            <div ref={finRef} />
          </div>
        </div>

        {/* barra de envío */}
        <form
          onSubmit={enviar}
          className="border-t border-sand-deep/60 bg-white px-3 py-3 sm:px-6"
        >
          <div className="mx-auto flex max-w-2xl items-end gap-2">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviar(e);
                }
              }}
              rows={1}
              placeholder="Escribe un mensaje…"
              maxLength={1000}
              className="slim-scroll max-h-28 min-h-[2.75rem] flex-1 resize-none rounded-2xl border-2 border-sand-deep bg-cream px-4 py-2.5 text-sm outline-none transition-colors focus:border-taxi focus:bg-white"
            />
            <button
              type="submit"
              disabled={!texto.trim() || enviando}
              aria-label="Enviar"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-taxi text-volcanic shadow-card transition-all hover:bg-taxi-dark active:scale-95 disabled:opacity-40"
            >
              {enviando ? <Spinner className="border-volcanic/30 border-t-volcanic" /> : <IconSend />}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
