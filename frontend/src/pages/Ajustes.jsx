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
  const esTaxista = user?.rol === "TAXISTA";
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [modelo, setModelo] = useState(user?.vehiculoModelo || "");
  const [matricula, setMatricula] = useState(user?.vehiculoMatricula || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [sound, setSound] = useState(prefs.getSound());
  const [nearby, setNearby] = useState(prefs.getNearby());
  // cambio de contraseña
  const [pwdActual, setPwdActual] = useState("");
  const [pwdNueva, setPwdNueva] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMsg, setPwdMsg] = useState(null); // {ok, text}

  const dirty =
    (nombre.trim() !== (user?.nombre || "") && nombre.trim().length >= 2) ||
    telefono.trim() !== (user?.telefono || "") ||
    (esTaxista &&
      (modelo.trim() !== (user?.vehiculoModelo || "") ||
        matricula.trim().toUpperCase() !== (user?.vehiculoMatricula || "")));

  async function guardar() {
    setSaving(true);
    setSavedMsg("");
    try {
      const me = await api.actualizarMe({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        vehiculoModelo: esTaxista ? modelo.trim() : null,
        vehiculoMatricula: esTaxista ? matricula.trim() : null,
      });
      setUser(me);
      setSavedMsg("Guardado");
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (e) {
      setSavedMsg(e.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function cambiarPassword() {
    setPwdBusy(true);
    setPwdMsg(null);
    try {
      await api.cambiarPassword({ actual: pwdActual, nueva: pwdNueva });
      setPwdMsg({ ok: true, text: "Contraseña actualizada" });
      setPwdActual("");
      setPwdNueva("");
    } catch (e) {
      setPwdMsg({ ok: false, text: e.message || "No se pudo cambiar" });
    } finally {
      setPwdBusy(false);
    }
  }

  return (
    <Layout title="Ajustes" framed>
      <div className="h-full overflow-y-auto overflow-x-hidden slim-scroll">
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

            <div className="mt-5 space-y-2.5">
              <Input
                label="Tu nombre"
                name="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
              />
              <Input
                label="Teléfono (WhatsApp)"
                name="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="612 34 56 78"
                hint="Para contactar en las reservas"
              />
              {esTaxista && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Modelo"
                    name="vehiculoModelo"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="Toyota Prius"
                  />
                  <Input
                    label="Matrícula"
                    name="vehiculoMatricula"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    placeholder="1234-ABC"
                  />
                </div>
              )}
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

          {/* seguridad */}
          <section className="surface p-5">
            <h3 className="mb-1 font-display text-base font-extrabold">Seguridad</h3>
            <p className="mb-3 text-xs text-volcanic/50">
              Cambia tu contraseña verificando la actual.
            </p>
            <div className="space-y-2.5">
              <Input
                label="Contraseña actual"
                name="pwdActual"
                type="password"
                value={pwdActual}
                onChange={(e) => setPwdActual(e.target.value)}
                placeholder="tu contraseña de ahora"
              />
              <Input
                label="Contraseña nueva"
                name="pwdNueva"
                type="password"
                value={pwdNueva}
                onChange={(e) => setPwdNueva(e.target.value)}
                placeholder="mínimo 6 caracteres"
                hint={pwdNueva && pwdNueva.length < 6 ? "Mínimo 6 caracteres" : undefined}
              />
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="sea"
                  disabled={pwdBusy || !pwdActual || pwdNueva.length < 6}
                  onClick={cambiarPassword}
                >
                  {pwdBusy ? <Spinner /> : "Cambiar contraseña"}
                </Button>
                {pwdMsg && (
                  <span
                    className={`animate-fade-up text-sm font-semibold ${
                      pwdMsg.ok ? "text-atlantic-dark" : "text-coral"
                    }`}
                  >
                    {pwdMsg.text}
                  </span>
                )}
              </div>
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
