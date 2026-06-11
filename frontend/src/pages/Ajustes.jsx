import { useState } from "react";
import Layout from "../components/Layout.jsx";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import Spinner from "../components/Spinner.jsx";
import { IconLogout } from "../components/icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { prefs } from "../utils/prefs.js";

function Toggle({ checked, onChange, label, hint }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl px-1 py-2.5 text-left"
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-volcanic/50">{hint}</span>}
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-taxi" : "bg-volcanic/15"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </span>
    </button>
  );
}

export default function Ajustes() {
  const { user, setUser, logout } = useAuth();
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [sound, setSound] = useState(prefs.getSound());
  const [nearby, setNearby] = useState(prefs.getNearby());

  const dirty = nombre.trim() !== (user?.nombre || "") && nombre.trim().length >= 2;

  async function guardar() {
    setSaving(true);
    setSavedMsg("");
    try {
      const me = await api.actualizarMe({ nombre: nombre.trim() });
      setUser(me);
      setSavedMsg("Guardado");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (e) {
      setSavedMsg(e.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout title="Ajustes" framed>
      <div className="h-full overflow-y-auto slim-scroll">
        <div className="mx-auto max-w-xl space-y-4 p-4 lg:p-6">
          {/* perfil */}
          <section className="surface p-5">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-taxi font-display text-2xl font-extrabold text-volcanic shadow-sun">
                {(user?.nombre || "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-extrabold">{user?.nombre}</p>
                <p className="truncate text-sm text-volcanic/55">{user?.email}</p>
                <span className="pill mt-1.5 bg-atlantic/12 text-atlantic-dark">
                  {user?.rol === "TAXISTA" ? "Taxista" : "Cliente"}
                </span>
              </div>
            </div>

            {user?.vehiculoMatricula && (
              <p className="mt-4 rounded-xl bg-sand px-3 py-2 text-sm font-semibold text-volcanic/70">
                Vehículo: {user.vehiculoModelo} · {user.vehiculoMatricula}
              </p>
            )}

            <div className="mt-5 space-y-2.5">
              <Input
                label="Tu nombre"
                name="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
              />
              <div className="flex items-center gap-3">
                <Button size="sm" disabled={!dirty || saving} onClick={guardar}>
                  {saving ? <Spinner className="border-volcanic/30 border-t-volcanic" /> : "Guardar"}
                </Button>
                {savedMsg && (
                  <span className="animate-fade-up text-sm font-semibold text-atlantic-dark">
                    {savedMsg}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* preferencias funcionales */}
          <section className="surface p-5">
            <h3 className="mb-2 font-display text-base font-extrabold">Preferencias</h3>
            <div className="divide-y divide-sand-deep/60">
              <Toggle
                checked={sound}
                onChange={(v) => {
                  setSound(v);
                  prefs.setSound(v);
                }}
                label="Sonido de notificaciones"
                hint="Pitido al recibir una solicitud de viaje (taxista)"
              />
              <Toggle
                checked={nearby}
                onChange={(v) => {
                  setNearby(v);
                  prefs.setNearby(v);
                }}
                label="Taxis cercanos en el mapa"
                hint="Muestra los taxis libres alrededor (cliente)"
              />
            </div>
          </section>

          {/* cuenta */}
          <section className="surface p-5">
            <h3 className="mb-3 font-display text-base font-extrabold">Cuenta</h3>
            <Button variant="outline" full onClick={logout}>
              <IconLogout />
              Cerrar sesión
            </Button>
          </section>
        </div>
      </div>
    </Layout>
  );
}
