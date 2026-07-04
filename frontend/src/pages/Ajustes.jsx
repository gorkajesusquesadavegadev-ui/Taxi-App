import { useEffect, useState } from "react";
import Layout from "../components/Layout.jsx";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import Spinner from "../components/Spinner.jsx";
import { IconLogout } from "../components/icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api/client.js";
import { prefs, TONOS, reproducirTono } from "../utils/prefs.js";
import { pushSoportado, pushActivo, activarPush, desactivarPush } from "../api/push.js";
import { useI18n } from "../i18n/index.jsx";

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
  const { t: tr } = useI18n();
  const esTaxista = user?.rol === "TAXISTA";
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [modelo, setModelo] = useState(user?.vehiculoModelo || "");
  const [matricula, setMatricula] = useState(user?.vehiculoMatricula || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [accesible, setAccesible] = useState(!!user?.vehiculoAccesible);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [sound, setSound] = useState(prefs.getSound());
  const [tono, setTono] = useState(prefs.getTono());
  const [nearby, setNearby] = useState(prefs.getNearby());
  const [push, setPush] = useState(false);
  const [pushMsg, setPushMsg] = useState("");
  useEffect(() => { pushActivo().then(setPush).catch(() => {}); }, []);
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
        matricula.trim().toUpperCase() !== (user?.vehiculoMatricula || "") ||
        accesible !== !!user?.vehiculoAccesible));

  async function guardar() {
    setSaving(true);
    setSavedMsg("");
    try {
      const me = await api.actualizarMe({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        vehiculoModelo: esTaxista ? modelo.trim() : null,
        vehiculoMatricula: esTaxista ? matricula.trim() : null,
        vehiculoAccesible: esTaxista ? accesible : null,
      });
      setUser(me);
      setSavedMsg(tr("set.saved"));
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (e) {
      setSavedMsg(e.message || tr("set.couldNotSave"));
    } finally {
      setSaving(false);
    }
  }

  async function cambiarPassword() {
    setPwdBusy(true);
    setPwdMsg(null);
    try {
      await api.cambiarPassword({ actual: pwdActual, nueva: pwdNueva });
      setPwdMsg({ ok: true, text: tr("set.pwdUpdated") });
      setPwdActual("");
      setPwdNueva("");
    } catch (e) {
      setPwdMsg({ ok: false, text: e.message || tr("set.couldNotChange") });
    } finally {
      setPwdBusy(false);
    }
  }

  return (
    <Layout title={tr("nav.settings")} framed>
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
                  {user?.rol === "TAXISTA" ? tr("set.driver") : tr("set.client")}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              <Input
                label={tr("set.yourName")}
                name="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder={tr("set.yourName")}
              />
              <Input
                label={tr("auth.phoneWhatsapp")}
                name="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="612 34 56 78"
                hint={tr("set.forBookings")}
              />
              {esTaxista && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label={tr("auth.model")}
                    name="vehiculoModelo"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="Toyota Prius"
                  />
                  <Input
                    label={tr("auth.plate")}
                    name="vehiculoMatricula"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    placeholder="1234-ABC"
                  />
                </div>
              )}
              {esTaxista && (
                <button
                  type="button"
                  onClick={() => setAccesible((a) => !a)}
                  aria-pressed={accesible}
                  className={`flex w-full items-center gap-2 rounded-2xl border-2 px-3 py-2 text-sm font-bold transition-colors ${
                    accesible ? "border-atlantic bg-atlantic/10 text-atlantic-dark" : "border-sand-deep bg-white text-volcanic/60"
                  }`}
                >
                  <span className="text-base">♿</span>
                  {tr("set.accessibleVehicle")}
                  <span className={`ml-auto h-5 w-9 rounded-full p-0.5 transition-colors ${accesible ? "bg-atlantic" : "bg-volcanic/20"}`}>
                    <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${accesible ? "translate-x-4" : ""}`} />
                  </span>
                </button>
              )}
              <div className="flex items-center gap-3">
                <Button size="sm" disabled={!dirty || saving} onClick={guardar}>
                  {saving ? <Spinner className="border-volcanic/30 border-t-volcanic" /> : tr("common.save")}
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
            <h3 className="mb-2 font-display text-base font-extrabold">{tr("set.preferences")}</h3>
            <div className="divide-y divide-sand-deep/60">
              <Toggle
                checked={sound}
                onChange={(v) => {
                  setSound(v);
                  prefs.setSound(v);
                }}
                label={tr("set.notifSound")}
                hint={tr("set.notifSoundHint")}
              />
              {sound && (
                <div className="py-3">
                  <p className="text-sm font-semibold text-volcanic">Tono de aviso</p>
                  <div className="mt-2 space-y-1.5">
                    {TONOS.map((t) => (
                      <div
                        key={t.id}
                        className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 transition-colors ${
                          tono === t.id ? "border-taxi bg-taxi/10" : "border-sand-deep bg-white"
                        }`}
                      >
                        <button
                          onClick={() => { setTono(t.id); prefs.setTono(t.id); reproducirTono(t.id); }}
                          className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-volcanic"
                        >
                          <span className={`grid h-4 w-4 place-items-center rounded-full border-2 ${tono === t.id ? "border-taxi" : "border-volcanic/30"}`}>
                            {tono === t.id && <span className="h-2 w-2 rounded-full bg-taxi" />}
                          </span>
                          {t.label}
                        </button>
                        <button
                          onClick={() => reproducirTono(t.id)}
                          aria-label={`Escuchar ${t.label}`}
                          className="rounded-lg bg-sand px-2.5 py-1 text-xs font-bold text-volcanic hover:bg-sand-deep"
                        >
                          ▶ {tr("set.test")}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Toggle
                checked={nearby}
                onChange={(v) => {
                  setNearby(v);
                  prefs.setNearby(v);
                }}
                label={tr("set.nearbyTaxis")}
                hint={tr("set.nearbyHint")}
              />
              {pushSoportado() && (
                <Toggle
                  checked={push}
                  onChange={async (v) => {
                    if (v) {
                      const res = await activarPush();
                      setPush(res.ok);
                      setPushMsg(res.ok ? tr("set.pushOn") : "⚠️ " + res.motivo);
                    } else {
                      await desactivarPush();
                      setPush(false);
                      setPushMsg("");
                    }
                  }}
                  label={tr("set.pushLabel")}
                  hint={tr("set.pushHint")}
                />
              )}
            </div>
            {pushMsg && <p className="mt-2 text-xs font-semibold text-volcanic/70">{pushMsg}</p>}
          </section>

          {/* seguridad */}
          <section className="surface p-5">
            <h3 className="mb-1 font-display text-base font-extrabold">{tr("set.security")}</h3>
            <p className="mb-3 text-xs text-volcanic/50">
              Cambia tu contraseña verificando la actual.
            </p>
            <div className="space-y-2.5">
              <Input
                label={tr("set.currentPwd")}
                name="pwdActual"
                type="password"
                value={pwdActual}
                onChange={(e) => setPwdActual(e.target.value)}
                placeholder={tr("set.currentPwdPh")}
              />
              <Input
                label={tr("set.newPwd")}
                name="pwdNueva"
                type="password"
                value={pwdNueva}
                onChange={(e) => setPwdNueva(e.target.value)}
                placeholder="mínimo 6 caracteres"
                hint={pwdNueva && pwdNueva.length < 6 ? tr("set.min6") : undefined}
              />
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="sea"
                  disabled={pwdBusy || !pwdActual || pwdNueva.length < 6}
                  onClick={cambiarPassword}
                >
                  {pwdBusy ? <Spinner /> : tr("set.changePwd")}
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
            <h3 className="mb-3 font-display text-base font-extrabold">{tr("set.account")}</h3>
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
