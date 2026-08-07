import { Link, useNavigate } from "react-router-dom";
import { LogoWordmark } from "../../components/Logo.jsx";
import { useI18n } from "../../i18n/index.jsx";
import { LEGAL } from "../../i18n/legal.js";

// Renderiza **negrita** y `código` dentro de un texto plano.
function Rich({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold text-volcanic">{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="rounded bg-sand px-1 py-0.5 font-mono text-xs">{part.slice(1, -1)}</code>;
    return part;
  });
}

const DOCS = [
  { id: "aviso", path: "/aviso-legal", labelKey: "legal.notice", icon: "🏛️" },
  { id: "privacy", path: "/privacidad", labelKey: "legal.privacy", icon: "🔒" },
  { id: "terms", path: "/terminos", labelKey: "legal.terms", icon: "📋" },
  { id: "cookies", path: "/cookies", labelKey: "legal.cookies", icon: "🍪" },
];

export default function LegalDoc({ doc }) {
  const nav = useNavigate();
  const { t, lang } = useI18n();
  const L = LEGAL[lang] ?? LEGAL.es;
  const content = L[doc];
  const meta = DOCS.find((d) => d.id === doc);

  return (
    <div className="min-h-screen bg-cream px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => nav(-1)}
            className="inline-flex items-center gap-1.5 rounded-full border border-sand-deep bg-white px-4 py-2 text-sm font-semibold text-atlantic-dark shadow-sm transition hover:bg-sand"
          >
            ← {t("legal.back")}
          </button>
          <LogoWordmark height={24} />
        </div>

        <div className="overflow-hidden rounded-3xl border border-sand-deep/60 bg-white shadow-sm">
          <div className="border-b border-sand-deep/40 bg-gradient-to-br from-sand/60 to-cream px-6 py-6 sm:px-8">
            <div className="mb-2 text-3xl" aria-hidden="true">{meta?.icon}</div>
            <h1 className="font-display text-2xl font-extrabold text-volcanic sm:text-3xl">{content.title}</h1>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-volcanic/40">{L.updated}</p>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <p className="mb-8 rounded-xl border border-taxi/30 bg-taxi/10 px-4 py-3 text-xs font-semibold leading-relaxed text-volcanic/70">
              ⚖️ {t("legal.binding")}
            </p>

            <div className="space-y-8 text-sm leading-relaxed text-volcanic/80">
              {content.sections.map((s, i) => (
                <section key={i}>
                  <h2 className="mb-3 flex items-start gap-2 font-display text-base font-bold text-volcanic">
                    <span className="mt-0.5 h-4 w-1 shrink-0 rounded-full bg-taxi" aria-hidden="true" />
                    {s.t}
                  </h2>
                  {s.p?.map((p, j) => (
                    <p key={j} className="mb-2"><Rich text={p} /></p>
                  ))}
                  {s.list && (
                    <ul className="space-y-2 pl-1">
                      {s.list.map((item, j) => (
                        <li key={j} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-atlantic-dark/50" aria-hidden="true" />
                          <span><Rich text={item} /></span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {s.table && (
                    <div className="overflow-x-auto rounded-xl border border-sand-deep/60">
                      <table className="w-full text-xs">
                        <thead className="bg-sand">
                          <tr>
                            {s.table.headers.map((h, j) => (
                              <th key={j} className="px-3 py-2.5 text-left font-bold text-volcanic">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-sand-deep/40">
                          {s.table.rows.map((row, j) => (
                            <tr key={j} className="odd:bg-white even:bg-cream/60">
                              {row.map((cell, k) => (
                                <td key={k} className={`px-3 py-2.5 align-top ${k === 0 ? "font-mono font-medium text-volcanic" : ""}`}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {s.note && (
                    <p className="mt-3 rounded-lg bg-atlantic-dark/5 px-3 py-2 text-xs text-volcanic/60">
                      ✅ <Rich text={s.note} />
                    </p>
                  )}
                </section>
              ))}
            </div>
          </div>

          <div className="border-t border-sand-deep/40 bg-cream/60 px-6 py-5 sm:px-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-volcanic/40">{L.otherDocs}</p>
            <div className="flex flex-wrap gap-2">
              {DOCS.filter((d) => d.id !== doc).map((d) => (
                <Link
                  key={d.id}
                  to={d.path}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sand-deep bg-white px-4 py-2 text-xs font-semibold text-atlantic-dark shadow-sm transition hover:bg-sand"
                >
                  <span aria-hidden="true">{d.icon}</span> {t(d.labelKey)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
