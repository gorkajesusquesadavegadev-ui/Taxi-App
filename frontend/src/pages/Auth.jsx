import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import Spinner from "../components/Spinner.jsx";
import { IconBolt } from "../components/icons.jsx";

export default function Auth() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // login | register
  const [rol, setRol] = useState("CLIENTE");
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    vehiculoModelo: "",
    vehiculoMatricula: "",
    licencia: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        await register({
          nombre: form.nombre,
          email: form.email,
          password: form.password,
          rol,
          licencia: rol === "TAXISTA" ? form.licencia : null,
          vehiculoModelo: rol === "TAXISTA" ? form.vehiculoModelo : null,
          vehiculoMatricula: rol === "TAXISTA" ? form.vehiculoMatricula : null,
        });
      }
    } catch (err) {
      setError(err.message || "No se pudo completar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grain mesh-warm relative min-h-screen w-full bg-volcanic text-cream">
      {/* hero backdrop */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col">
        <div className="absolute inset-0 -z-0 overflow-hidden">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-taxi/25 blur-3xl" />
          <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-atlantic/30 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col px-6 pb-8 pt-14">
          {/* brand */}
          <div className="mb-8 animate-fade-up">
            <span className="grid h-14 w-14 place-items-center rounded-3xl bg-taxi text-volcanic font-display text-3xl font-extrabold shadow-glow">
              T
            </span>
            <h1 className="mt-5 font-display text-[2.7rem] font-extrabold leading-[0.95] tracking-tight">
              Tu taxi,
              <br />
              <span className="text-taxi">al instante</span>
            </h1>
            <p className="mt-3 max-w-xs text-cream/60">
              Pide o conduce por las islas. Tarifa clara, taxi en vivo en el mapa.
            </p>
          </div>

          {/* card */}
          <form
            onSubmit={submit}
            className="animate-fade-up rounded-[1.6rem] bg-cream p-5 text-volcanic shadow-card"
            style={{ animationDelay: "80ms" }}
          >
            {/* tabs */}
            <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-sand p-1">
              {["login", "register"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${
                    mode === m ? "bg-white text-volcanic shadow-sm" : "text-volcanic/50"
                  }`}
                >
                  {m === "login" ? "Entrar" : "Crear cuenta"}
                </button>
              ))}
            </div>

            {mode === "register" && (
              <div className="mb-3 grid grid-cols-2 gap-2">
                {["CLIENTE", "TAXISTA"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRol(r)}
                    className={`rounded-2xl border-2 py-3 text-sm font-bold transition-all ${
                      rol === r
                        ? "border-taxi bg-taxi/15 text-volcanic"
                        : "border-sand-deep text-volcanic/50"
                    }`}
                  >
                    {r === "CLIENTE" ? "🙋 Cliente" : "🚕 Taxista"}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {mode === "register" && (
                <Input
                  label="Nombre"
                  name="nombre"
                  placeholder="Tu nombre"
                  value={form.nombre}
                  onChange={set("nombre")}
                  required
                />
              )}
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={set("email")}
                required
              />
              <Input
                label="Contraseña"
                name="password"
                type="password"
                placeholder="mínimo 6 caracteres"
                value={form.password}
                onChange={set("password")}
                minLength={6}
                required
              />
              {mode === "register" && rol === "TAXISTA" && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Modelo"
                    name="vehiculoModelo"
                    placeholder="Toyota Prius"
                    value={form.vehiculoModelo}
                    onChange={set("vehiculoModelo")}
                  />
                  <Input
                    label="Matrícula"
                    name="vehiculoMatricula"
                    placeholder="1234-ABC"
                    value={form.vehiculoMatricula}
                    onChange={set("vehiculoMatricula")}
                  />
                </div>
              )}
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-coral/12 px-3 py-2 text-sm font-medium text-coral">
                {error}
              </p>
            )}

            <Button type="submit" full size="lg" className="mt-4" disabled={busy}>
              {busy ? <Spinner className="border-volcanic/30 border-t-volcanic" /> : <IconBolt />}
              {mode === "login" ? "Entrar" : "Crear cuenta"}
            </Button>
          </form>

          <p className="relative z-10 mt-6 text-center text-xs text-cream/40">
            TAYA · taxi de Canarias · MVP
          </p>
        </div>
      </div>
    </div>
  );
}
