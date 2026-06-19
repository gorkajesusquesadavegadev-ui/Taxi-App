import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import Spinner from "../components/Spinner.jsx";
import { IconBolt, IconPin, IconCar } from "../components/icons.jsx";
import { LogoWordmark, LogoFull } from "../components/Logo.jsx";

/* ---------- live validation ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(form, mode) {
  const e = {};
  if (mode === "register" && form.nombre.trim().length < 2) e.nombre = "Escribe tu nombre";
  if (!EMAIL_RE.test(form.email)) e.email = "Ese email no parece válido";
  if (form.password.length < 6) e.password = "Mínimo 6 caracteres";
  return e;
}

// 0–3: rough password strength for the visual meter
function strengthOf(pwd) {
  if (pwd.length < 6) return 0;
  let s = 1;
  if (pwd.length >= 9) s++;
  if (/[A-ZÑ]/.test(pwd) && /\d/.test(pwd)) s++;
  return s;
}
const STRENGTH = [
  { label: "Muy corta", bar: "bg-volcanic/20", text: "text-volcanic/50", w: "w-[12%]" },
  { label: "Débil", bar: "bg-volcanic/45", text: "text-volcanic/60", w: "w-1/3" },
  { label: "Buena", bar: "bg-atlantic", text: "text-atlantic-dark", w: "w-2/3" },
  { label: "Fuerte como el sol", bar: "bg-taxi", text: "text-taxi-dark", w: "w-full" },
];

/* =================================================================
   Postal viva de Gran Canaria: cielo con aviones Binter, mar con
   ferries Fred. Olsen, costa en bucle con hitos de la isla y vallas
   de marcas locales. El taxi pita si le haces click.
   ================================================================= */

function Wave({ className, fill, opacity, duration, delay = "0s" }) {
  return (
    <div className={`auth-wave ${className}`} style={{ animationDuration: duration, animationDelay: delay }}>
      <svg viewBox="0 0 2880 120" preserveAspectRatio="none" className="block h-full w-full">
        <path
          d="M0,60 C240,18 480,102 720,60 C960,18 1200,102 1440,60 C1680,18 1920,102 2160,60 C2400,18 2640,102 2880,60 L2880,120 L0,120 Z"
          fill={fill}
          opacity={opacity}
        />
      </svg>
    </div>
  );
}

function TaxiSvg() {
  return (
    <svg className="auth-taxi" width="120" height="64" viewBox="0 0 120 64" fill="none">
      {/* roof sign */}
      <rect x="50" y="2" width="20" height="10" rx="3" fill="#0B2E4F" />
      <text x="60" y="10" textAnchor="middle" fontSize="7" fontWeight="800" fill="#FFC400" fontFamily="Arial Black, Arial">
        TAXI
      </text>
      {/* cabin */}
      <path d="M34 28 Q38 12 56 12 L72 12 Q88 12 93 28 Z" fill="#FFC400" />
      <path d="M42 26 Q45 16 56 16 L62 16 L62 26 Z" fill="#BFE0F5" />
      <path d="M66 26 L66 16 L71 16 Q83 16 87 26 Z" fill="#BFE0F5" />
      {/* body */}
      <rect x="14" y="26" width="92" height="22" rx="10" fill="#FFC400" />
      <rect x="14" y="33" width="92" height="6" fill="#0B2E4F" opacity="0.9" />
      {/* lights */}
      <circle cx="104" cy="36" r="3" fill="#FFF8E3" />
      <circle cx="16" cy="36" r="2.5" fill="#0B5C9E" />
      {/* wheels */}
      <circle cx="36" cy="50" r="9" fill="#0B2E4F" />
      <circle cx="36" cy="50" r="3.5" fill="#F7FBFE" />
      <circle cx="84" cy="50" r="9" fill="#0B2E4F" />
      <circle cx="84" cy="50" r="3.5" fill="#F7FBFE" />
    </svg>
  );
}

/* ---- mar: ferries Fred. Olsen ---- */
function FerrySvg({ width = 250 }) {
  return (
    <svg width={width} viewBox="0 0 250 100" fill="none" className="block">
      {/* puente de mando */}
      <rect x="58" y="20" width="112" height="16" rx="5" fill="#FFFFFF" />
      <rect x="64" y="24" width="100" height="7" rx="3.5" fill="#4AA3DD" />
      <path d="M196 20 q15 4 11 18 h-15 Z" fill="#FFC400" />
      {/* cubierta de pasaje */}
      <rect x="40" y="36" width="172" height="24" rx="5" fill="#F7FBFE" />
      {[...Array(8)].map((_, i) => (
        <rect key={i} x={52 + i * 20} y="42" width="11" height="8" rx="2" fill="#4AA3DD" />
      ))}
      {/* casco */}
      <path d="M8 60 H246 L224 88 Q125 96 34 88 Z" fill="#FFFFFF" />
      <rect x="22" y="63" width="212" height="5" rx="2.5" fill="#1577C2" />
      <text
        x="127"
        y="83"
        textAnchor="middle"
        fontSize="13"
        fontStyle="italic"
        fontWeight="800"
        fill="#0B5C9E"
        fontFamily="Georgia, 'Times New Roman', serif"
      >
        Fred. Olsen Express
      </text>
    </svg>
  );
}

// ferry lejano: pequeño, sin texto, navega en sentido contrario
function FarFerrySvg() {
  return (
    <svg width="108" height="44" viewBox="0 0 110 44" fill="none" className="block" style={{ transform: "scaleX(-1)" }}>
      <rect x="26" y="10" width="56" height="10" rx="3" fill="#F7FBFE" />
      <path d="M4 20 H106 L94 38 Q55 44 16 38 Z" fill="#FFFFFF" />
      <rect x="12" y="24" width="86" height="3" fill="#1577C2" />
      <path d="M70 8 q8 2 6 12 h-9 Z" fill="#FFC400" />
    </svg>
  );
}

/* ---- cielo: ATR-72 de Binter, librea real (blanco + verde Binter) ---- */
function PlaneSvg({ width = 150 }) {
  return (
    <svg width={width} viewBox="0 0 170 64" fill="none" className="block">
      {/* cola verde con destello */}
      <path d="M16 32 L2 6 H26 L38 30 Z" fill="#00A87E" />
      <path d="M10 12 q8 -3 14 6 l-4 8 q-8 -4 -10 -14 Z" fill="#5FCDA4" opacity="0.7" />
      {/* fuselaje */}
      <rect x="10" y="27" width="132" height="17" rx="8.5" fill="#FFFFFF" />
      <path d="M142 27 q20 4.5 24 8.5 q-4 4 -24 8.5 Z" fill="#FFFFFF" />
      <rect x="14" y="40" width="126" height="3.4" rx="1.7" fill="#00A87E" />
      {/* cabina */}
      <path d="M152 31 q8 2.5 11 4.5 l-11 3.5 Z" fill="#143C2E" />
      {/* ala alta + motor verde + hélice */}
      <path d="M64 27 L40 10 H62 L90 27 Z" fill="#EAF6F1" />
      <rect x="66" y="21" width="20" height="9" rx="4.5" fill="#00A87E" />
      <path d="M88 14 v22" stroke="#143C2E" strokeWidth="1.6" opacity="0.4" />
      {/* canario verde + wordmark */}
      <circle cx="100" cy="34" r="3.2" fill="#00A87E" />
      <path d="M100 31 q4 -3 6 0 l-4 3 Z" fill="#00A87E" />
      <text
        x="122"
        y="38"
        textAnchor="middle"
        fontSize="11"
        fontWeight="800"
        fill="#3F4A52"
        fontFamily="Arial, sans-serif"
        letterSpacing="0.5"
      >
        binter
      </text>
    </svg>
  );
}

function Cloud({ className = "", scale = 1 }) {
  return (
    <div className={`flex items-end ${className}`} style={{ transform: `scale(${scale})` }}>
      <span className="h-6 w-10 rounded-full bg-white/80" />
      <span className="-ml-4 mb-1 h-9 w-14 rounded-full bg-white/90" />
      <span className="-ml-5 h-6 w-12 rounded-full bg-white/75" />
    </div>
  );
}

function Gull({ className = "", style }) {
  return (
    <svg width="26" height="12" viewBox="0 0 26 12" fill="none" className={className} style={style}>
      <path d="M1 9 Q7 1 13 8 Q19 1 25 9" stroke="#0B2E4F" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ---- costa: hitos de Gran Canaria ---- */
function DunasSvg() {
  return (
    <svg width="190" height="74" viewBox="0 0 190 74" fill="none" className="block">
      <path d="M0 74 Q46 14 96 50 Q130 70 190 74 Z" fill="#FFC400" />
      <path d="M52 74 Q120 4 190 60 L190 74 Z" fill="#FFE9A6" />
      <path d="M0 74 Q46 14 96 50 L96 74 Z" fill="#E8AF00" opacity="0.5" />
      <path d="M14 62 Q46 26 88 48" stroke="#E8AF00" strokeWidth="2" opacity="0.7" />
      <path d="M86 66 Q130 26 178 58" stroke="#FFF3C4" strokeWidth="2" opacity="0.85" />
    </svg>
  );
}

function RoqueSvg() {
  return (
    <svg width="120" height="92" viewBox="0 0 120 92" fill="none" className="block">
      <path d="M0 92 Q28 58 58 52 Q94 46 120 92 Z" fill="#11395F" />
      <path d="M50 54 L55 14 Q57 6 63 8 L69 12 L66 54 Z" fill="#0B2E4F" />
      <path d="M55 14 Q57 6 63 8 L61 50 L55 52 Z" fill="#4AA3DD" opacity="0.3" />
    </svg>
  );
}

function CatedralSvg() {
  return (
    <svg width="168" height="100" viewBox="0 0 168 100" fill="none" className="block">
      <rect x="44" y="46" width="80" height="54" fill="#F7FBFE" />
      <rect x="44" y="46" width="80" height="5" fill="#4AA3DD" opacity="0.5" />
      <rect x="14" y="28" width="32" height="72" fill="#FFFFFF" />
      <path d="M14 28 Q30 6 46 28 Z" fill="#1577C2" />
      <rect x="122" y="28" width="32" height="72" fill="#FFFFFF" />
      <path d="M122 28 Q138 6 154 28 Z" fill="#1577C2" />
      <path d="M26 42 q4 -6 8 0 v12 h-8 Z" fill="#0B2E4F" />
      <path d="M134 42 q4 -6 8 0 v12 h-8 Z" fill="#0B2E4F" />
      <circle cx="84" cy="64" r="9" fill="#4AA3DD" />
      <circle cx="84" cy="64" r="4" fill="#FFC400" />
      <path d="M72 100 v-15 q12 -12 24 0 v15 Z" fill="#0B2E4F" />
      <path d="M30 3 v10 M26 7 h8" stroke="#FFC400" strokeWidth="2.4" />
      <path d="M138 3 v10 M134 7 h8" stroke="#FFC400" strokeWidth="2.4" />
    </svg>
  );
}

function TeideSvg() {
  return (
    <svg width="90" height="100" viewBox="0 0 90 100" fill="none" className="block">
      <path d="M0 100 Q20 55 45 8 Q70 55 90 100 Z" fill="#5B3A29" />
      <path d="M24 100 Q38 62 45 8 L45 100 Z" fill="#7A4A34" opacity="0.4" />
      <path d="M45 8 Q40 18 37 24 Q45 18 53 24 Q50 18 45 8 Z" fill="#FFFFFF" />
      <ellipse cx="66" cy="42" rx="15" ry="6" fill="white" opacity="0.6" />
    </svg>
  );
}

function TimanfayaSvg() {
  return (
    <svg width="100" height="72" viewBox="0 0 100 72" fill="none" className="block">
      <path d="M0 72 Q20 38 50 28 Q80 38 100 72 Z" fill="#1a0a05" />
      <path d="M18 72 Q36 45 50 28 L50 72 Z" fill="#3d1505" opacity="0.5" />
      <ellipse cx="33" cy="50" rx="10" ry="6" fill="#8B2500" opacity="0.85" />
      <ellipse cx="67" cy="45" rx="8" ry="5" fill="#B83000" opacity="0.8" />
      <path d="M33 44 C30 34 34 26 33 22" stroke="#888" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <path d="M67 39 C65 28 70 20 69 16" stroke="#888" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

function FaroSvg() {
  return (
    <svg width="46" height="110" viewBox="0 0 46 110" fill="none" className="block">
      <rect x="14" y="22" width="18" height="78" fill="#FFFFFF" stroke="#0B2E4F" strokeWidth="1.5" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="14" y={40 + i * 16} width="18" height="7" fill="#E03131" opacity="0.65" />
      ))}
      <rect x="10" y="12" width="26" height="12" rx="3" fill="#FFC400" />
      <rect x="8" y="10" width="30" height="4" rx="2" fill="#0B2E4F" />
      <circle cx="23" cy="18" r="4" fill="white" opacity="0.9" />
      <rect x="8" y="98" width="30" height="12" rx="2" fill="#0B2E4F" />
      <rect x="16" y="2" width="1.5" height="10" fill="#0B2E4F" />
      <path d="M17.5 2 l10 3.5 l-10 3.5 Z" fill="#FFC400" />
    </svg>
  );
}

function JameosSvg() {
  return (
    <svg width="112" height="82" viewBox="0 0 112 82" fill="none" className="block">
      <path d="M0 82 Q12 44 32 32 Q56 20 80 32 Q100 44 112 82 Z" fill="#1a0a05" />
      <path d="M24 82 Q24 44 56 40 Q88 44 88 82 Z" fill="#0B2E4F" />
      <ellipse cx="56" cy="70" rx="24" ry="8" fill="#4AA3DD" opacity="0.85" />
      <ellipse cx="56" cy="70" rx="14" ry="4" fill="#BFE0F5" opacity="0.55" />
      <text x="56" y="78" textAnchor="middle" fontSize="7" fill="white" opacity="0.5" fontStyle="italic">lago</text>
    </svg>
  );
}

function GarajonayTrees() {
  return (
    <svg width="130" height="90" viewBox="0 0 130 90" fill="none" className="block">
      <rect x="8" y="55" width="9" height="35" rx="3" fill="#0B3D1C" />
      <ellipse cx="12" cy="44" rx="19" ry="22" fill="#155724" />
      <rect x="44" y="40" width="10" height="50" rx="3" fill="#0B3D1C" />
      <ellipse cx="49" cy="28" rx="24" ry="27" fill="#198754" />
      <rect x="82" y="50" width="9" height="40" rx="3" fill="#0B3D1C" />
      <ellipse cx="86" cy="38" rx="20" ry="23" fill="#155724" />
      <rect x="111" y="58" width="8" height="32" rx="3" fill="#0B3D1C" />
      <ellipse cx="115" cy="48" rx="16" ry="18" fill="#198754" />
      <ellipse cx="65" cy="74" rx="62" ry="11" fill="white" opacity="0.2" />
    </svg>
  );
}

function CastilloSvg() {
  return (
    <svg width="104" height="92" viewBox="0 0 104 92" fill="none" className="block">
      <rect x="0" y="30" width="24" height="62" fill="#F7FBFE" stroke="#0B2E4F" strokeWidth="1.5" />
      {[0, 1].map((i) => (
        <rect key={i} x={i * 12} y="18" width="10" height="14" rx="1.5" fill="#F7FBFE" stroke="#0B2E4F" strokeWidth="1.5" />
      ))}
      <rect x="80" y="30" width="24" height="62" fill="#F7FBFE" stroke="#0B2E4F" strokeWidth="1.5" />
      {[0, 1].map((i) => (
        <rect key={i} x={80 + i * 12} y="18" width="10" height="14" rx="1.5" fill="#F7FBFE" stroke="#0B2E4F" strokeWidth="1.5" />
      ))}
      <rect x="6" y="50" width="92" height="42" fill="#FFFFFF" stroke="#0B2E4F" strokeWidth="1.5" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={6 + i * 13} y="38" width="9" height="14" rx="1.5" fill="#F7FBFE" stroke="#0B2E4F" strokeWidth="1.5" />
      ))}
      <path d="M38 92 v-22 q14 -14 28 0 v22 Z" fill="#0B2E4F" />
      <rect x="50" y="2" width="1.5" height="18" fill="#0B2E4F" />
      <path d="M51.5 2 l14 5 l-14 5 Z" fill="#FFC400" />
    </svg>
  );
}

function TaburienterSvg() {
  return (
    <svg width="130" height="88" viewBox="0 0 130 88" fill="none" className="block">
      <path d="M0 88 Q18 30 65 18 Q112 30 130 88 Z" fill="#5B3A29" />
      <path d="M30 88 Q50 48 65 18 L65 88 Z" fill="#7A4A34" opacity="0.35" />
      <path d="M65 18 Q30 40 10 60 Q30 50 65 30 Q100 50 120 60 Q100 40 65 18 Z" fill="#3d2010" opacity="0.4" />
      <ellipse cx="65" cy="28" rx="30" ry="10" fill="#11395F" opacity="0.6" />
      <text x="65" y="34" textAnchor="middle" fontSize="7" fill="white" opacity="0.7" fontWeight="bold">CALDERA</text>
    </svg>
  );
}

function PalmSvg({ h = 92 }) {
  return (
    <svg width={h * 0.72} height={h} viewBox="0 0 72 100" fill="none" className="block">
      <path d="M36 100 Q31 62 40 32" stroke="#0B2E4F" strokeWidth="7" strokeLinecap="round" />
      <path d="M40 32 Q22 18 6 24 Q24 32 40 36 Z" fill="#1577C2" />
      <path d="M40 32 Q58 18 70 26 Q54 33 40 36 Z" fill="#1577C2" />
      <path d="M40 32 Q30 12 14 8 Q30 22 40 34 Z" fill="#4AA3DD" />
      <path d="M40 32 Q52 12 66 10 Q52 24 40 34 Z" fill="#4AA3DD" />
      <path d="M40 32 Q40 8 32 2 Q46 12 42 34 Z" fill="#1577C2" />
      <circle cx="38" cy="36" r="3.4" fill="#FFC400" />
      <circle cx="44" cy="37" r="3" fill="#FFC400" />
    </svg>
  );
}

// hito con su letrerito de postal
function Hito({ label, children }) {
  return (
    <div className="scene-item flex flex-col items-center gap-1.5" title={label}>
      {children}
      <span className="whitespace-nowrap rounded-full bg-cream/90 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-volcanic/70 shadow-sm">
        {label}
      </span>
    </div>
  );
}

/* ---- anuncios minimalistas: logos reales en /ads/ + dibujos limpios ---- */
// Tirma: wordmark oficial (crema) sobre el rosa de la marca
function TirmaAd() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1" style={{ background: "#E84A9A" }}>
      <img src="/ads/tirma.svg" alt="Tirma" className="h-10" draggable="false" />
      <p className="text-[7px] font-bold tracking-[0.28em] text-white/90">CHOCOLATE CON LECHE</p>
    </div>
  );
}

// Clipper: logo oficial sobre blanco
function ClipperAd() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white">
      <img src="/ads/clipper.jpg" alt="Clipper" className="h-full w-full object-contain" draggable="false" />
    </div>
  );
}

// Kalise: wordmark limpio sobre azul de marca
function KaliseAd() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center" style={{ background: "#0066B3" }}>
      <p className="text-2xl font-extrabold italic leading-none text-white" style={{ fontFamily: "Georgia, serif" }}>
        Kalise<span style={{ color: "#FFC400" }}>.</span>
      </p>
      <p className="mt-1 text-[7px] font-bold tracking-[0.3em] text-white/80">HELADOS DE CANARIAS</p>
    </div>
  );
}

// UD Las Palmas: escudo real + texto
function UdlpAd() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-2.5 bg-white">
      <img src="/ads/udlp.svg" alt="UD Las Palmas" className="h-16" draggable="false" />
      <div className="text-left leading-tight">
        <p className="text-[11px] font-extrabold" style={{ color: "#004B9B" }}>
          UD LAS
          <br />
          PALMAS
        </p>
        <p className="mt-0.5 text-[8px] font-bold italic" style={{ color: "#F3C100" }}>
          ¡Pío pío!
        </p>
      </div>
    </div>
  );
}

// El Carretón: huevo frito limpio + nombre
function CarretonAd() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-2.5 bg-[#FFF8E3]">
      <svg width="42" height="36" viewBox="0 0 40 34" className="shrink-0">
        <path d="M4 20 Q2 6 16 4 Q32 1 36 14 Q39 26 26 30 Q8 34 4 20 Z" fill="#FFFFFF" stroke="#F0E1B9" strokeWidth="2" />
        <circle cx="18" cy="16" r="7" fill="#FFC400" />
        <circle cx="15.5" cy="13.5" r="2" fill="#FFF3C4" />
      </svg>
      <div className="text-left leading-tight">
        <p className="text-[13px] font-extrabold" style={{ color: "#0B5C9E" }}>¡Carretooooon!</p>
        <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-volcanic/55">
          Rest. El Carretón
        </p>
        <p className="text-[8px] italic text-volcanic/50">huevos fritos con papas</p>
      </div>
    </div>
  );
}

// valla publicitaria: marco + patas, el anuncio va dentro
function Billboard({ title, children }) {
  return (
    <div className="scene-item flex flex-col items-center" title={title}>
      <div className="h-[5.6rem] w-48 overflow-hidden rounded-lg border-[3px] border-volcanic bg-white shadow-card">
        {children}
      </div>
      <div className="flex gap-12">
        <span className="h-8 w-1.5 rounded-b bg-volcanic" />
        <span className="h-8 w-1.5 rounded-b bg-volcanic" />
      </div>
    </div>
  );
}

// un tramo de costa; se pinta dos veces para el bucle sin costuras
function CostaSegment() {
  return (
    <div className="flex shrink-0 items-end gap-12 px-8">
      <Hito label="Dunas de Maspalomas">
        <DunasSvg />
      </Hito>
      <Billboard title="Tirma · chocolate canario">
        <TirmaAd />
      </Billboard>
      <PalmSvg />
      <Hito label="Teide · Tenerife">
        <TeideSvg />
      </Hito>
      <Billboard title="Clipper · el sabor de la isla">
        <ClipperAd />
      </Billboard>
      <Hito label="Catedral de Santa Ana">
        <CatedralSvg />
      </Hito>
      <PalmSvg h={78} />
      <Hito label="Faro de Maspalomas">
        <FaroSvg />
      </Hito>
      <Billboard title="Kalise · helados de Canarias">
        <KaliseAd />
      </Billboard>
      <Hito label="Roque Nublo">
        <RoqueSvg />
      </Hito>
      <Hito label="Timanfaya · Lanzarote">
        <TimanfayaSvg />
      </Hito>
      <Billboard title="UD Las Palmas · ¡Pío pío!">
        <UdlpAd />
      </Billboard>
      <PalmSvg />
      <Hito label="Jameos del Agua · Lanzarote">
        <JameosSvg />
      </Hito>
      <Billboard title="Restaurante El Carretón · huevos fritos">
        <CarretonAd />
      </Billboard>
      <Hito label="Garajonay · La Gomera">
        <GarajonayTrees />
      </Hito>
      <PalmSvg h={78} />
      <Hito label="Castillo de la Luz · Las Palmas">
        <CastilloSvg />
      </Hito>
      <Hito label="Caldera de Taburiente · La Palma">
        <TaburienterSvg />
      </Hito>
    </div>
  );
}

// anuncios que remolca la avioneta
const ADS = [
  "Vuela entre islas con BINTER",
  "Canarias en barco · Fred. Olsen",
  "Sube al Teide · Tenerife",
  "Timanfaya · La ruta del fuego",
  "Dunas de Maspalomas · Gran Canaria",
  "Garajonay · La Gomera te espera",
  "Caldera de Taburiente · La Palma",
  "Corralejo · Fuerteventura",
  "¡CARRETOOOON! · El Carretón, huevos fritos",
];

function Scene() {
  const [ad, setAd] = useState(0);
  const [honk, setHonk] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setAd((a) => (a + 1) % ADS.length), 7000);
    return () => clearInterval(id);
  }, []);

  function doHonk() {
    setHonk(true);
    setTimeout(() => setHonk(false), 600);
  }

  return (
    <div className="auth-sky pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* sol: en móvil pequeño y pegado arriba para que la tarjeta no lo tape */}
      <div className="auth-sun absolute right-[5%] top-3 h-16 w-16 lg:right-[14%] lg:top-[8%] lg:h-40 lg:w-40" />

      {/* nubes — móvil: banda libre entre tarjeta y mar; desktop: cielo alto */}
      <div className="auth-cross bottom-[19rem] lg:bottom-auto lg:top-[5%]" style={{ animationDuration: "120s", animationDelay: "-30s" }}>
        <Cloud />
      </div>
      <div className="auth-cross bottom-[17.5rem] lg:bottom-auto lg:top-[13%]" style={{ animationDuration: "160s", animationDelay: "-110s" }}>
        <Cloud scale={0.7} />
      </div>

      {/* Binter alto y rápido */}
      <div className="auth-cross bottom-[15.5rem] lg:bottom-auto lg:top-[8%]" style={{ animationDuration: "42s", animationDelay: "-12s" }}>
        <div className="scene-item auth-bob" title="Binter · vuela entre islas">
          <PlaneSvg width={110} />
        </div>
      </div>

      {/* avioneta con pancarta publicitaria rotativa */}
      <div className="auth-cross bottom-[13rem] lg:bottom-auto lg:top-[21%]" style={{ animationDuration: "70s", animationDelay: "-28s" }}>
        <div className="auth-bob flex items-center" style={{ animationDuration: "4.2s" }}>
          <div className="rounded-md border-2 border-volcanic bg-cream/95 px-3 py-1 shadow-card">
            <span key={ad} className="block animate-fade-up whitespace-nowrap text-[11px] font-extrabold uppercase tracking-wider text-volcanic">
              {ADS[ad]}
            </span>
          </div>
          <span className="h-0.5 w-8 bg-volcanic/70" />
          <PlaneSvg width={84} />
        </div>
      </div>

      {/* gaviotas */}
      <div className="auth-cross bottom-[11.2rem] lg:bottom-auto lg:top-[30%]" style={{ animationDuration: "85s", animationDelay: "-50s" }}>
        <div className="flex gap-6">
          <Gull className="auth-bob" />
          <Gull className="auth-bob mt-3" style={{ animationDelay: "-1s" }} />
        </div>
      </div>

      {/* ferry lejano (va hacia poniente) */}
      <div
        className="auth-cross bottom-[9.2rem] opacity-80 lg:bottom-[11.5rem]"
        style={{ animationDuration: "150s", animationDelay: "-60s", animationDirection: "reverse" }}
      >
        <FarFerrySvg />
      </div>

      {/* oleaje trasero */}
      <Wave className="bottom-[8rem] h-14 lg:bottom-[10rem] lg:h-20" fill="#CDE7F7" opacity="0.5" duration="13s" />
      <Wave className="bottom-[7.2rem] h-14 lg:bottom-[9rem] lg:h-20" fill="#4AA3DD" opacity="0.65" duration="9s" delay="-3s" />

      {/* ferry Fred. Olsen en primer plano */}
      <div className="auth-cross bottom-[6.6rem] lg:bottom-[8.4rem]" style={{ animationDuration: "90s", animationDelay: "-35s" }}>
        <div className="scene-item auth-bob" title="Fred. Olsen Express · Canarias en barco" style={{ animationDuration: "5s" }}>
          <FerrySvg width={210} />
        </div>
      </div>

      {/* oleaje delantero tapa la línea de flotación */}
      <Wave className="bottom-[6.2rem] h-14 lg:bottom-[7.6rem] lg:h-20" fill="#1577C2" opacity="0.9" duration="6.5s" delay="-1.5s" />

      {/* arena del paseo */}
      <div className="absolute inset-x-0 bottom-16 h-9 bg-gradient-to-b from-[#FFE9A6] to-[#F2DFA0] lg:bottom-20 lg:h-10" />

      {/* costa que pasa: hitos + vallas, en bucle (más pequeña en móvil) */}
      <div className="absolute inset-x-0 bottom-[4.4rem] h-0 origin-bottom-left scale-[0.78] lg:bottom-[5.6rem] lg:scale-100">
        <div className="auth-strip bottom-0" style={{ animationDuration: "58s" }}>
          <CostaSegment />
          <CostaSegment />
        </div>
      </div>

      {/* avenida marítima */}
      <div className="auth-road absolute inset-x-0 bottom-0 h-16 lg:h-20" />

      {/* taxi: click = bocinazo */}
      <button
        type="button"
        tabIndex={-1}
        onClick={doHonk}
        className={`scene-item absolute bottom-7 left-[8%] scale-75 border-0 bg-transparent p-0 sm:scale-90 lg:bottom-9 lg:left-[12%] lg:scale-100 ${
          honk ? "auth-honk" : ""
        }`}
        title="¡Pita!"
      >
        {honk && (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 animate-pop whitespace-nowrap rounded-full bg-cream px-2.5 py-1 text-[10px] font-extrabold text-volcanic shadow-card">
            ¡PII PIII!
          </span>
        )}
        <TaxiSvg />
      </button>

      {/* grain on top of the whole postcard */}
      <div className="grain absolute inset-0" />
    </div>
  );
}

/* ---------- page ---------- */
export default function Auth() {
  const { login, register } = useAuth();
  const [open, setOpen] = useState(false); // false = portada TAYA, true = formulario
  const [mode, setMode] = useState("login"); // login | register
  const [rol, setRol] = useState("CLIENTE");
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    vehiculoModelo: "",
    vehiculoMatricula: "",
    licencia: "",
    telefono: "",
  });
  const [touched, setTouched] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [logoPop, setLogoPop] = useState(false);

  const errs = validate(form, mode);
  const fieldError = (k) => (touched[k] ? errs[k] : "");
  const fieldOk = (k) => Boolean(touched[k] && !errs[k] && form[k]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const blur = (k) => () => setTouched((t) => ({ ...t, [k]: true }));

  const strength = strengthOf(form.password);
  const sMeta = STRENGTH[strength];

  function failShake() {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }

  async function submit(e) {
    e.preventDefault();
    if (Object.keys(errs).length > 0) {
      setTouched({ nombre: true, email: true, password: true });
      failShake();
      return;
    }
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
          telefono: form.telefono || null,
          licencia: rol === "TAXISTA" ? form.licencia : null,
          vehiculoModelo: rol === "TAXISTA" ? form.vehiculoModelo : null,
          vehiculoMatricula: rol === "TAXISTA" ? form.vehiculoMatricula : null,
        });
      }
    } catch (err) {
      setError(err.message || "No se pudo completar");
      failShake();
    } finally {
      setBusy(false);
    }
  }

  function switchMode(m) {
    setMode(m);
    setTouched({});
    setError("");
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-volcanic">
      <Scene />

      {/* brand chip (solo con el formulario abierto; en portada manda el logo gigante) */}
      {open && (
        <div className="absolute left-4 top-4 z-20 lg:left-8 lg:top-6">
          <div className="rounded-2xl bg-white/85 px-4 py-2 shadow-sm backdrop-blur-md">
            <LogoWordmark height={26} />
          </div>
        </div>
      )}

      {/* ---------- portada: logo + CanaryCab gigante + CTA ---------- */}
      {!open && (
        <div className="pointer-events-none relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pb-[38vh] text-center lg:pb-[26vh]">
          <p className="animate-fade-up rounded-full bg-cream/80 px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.3em] text-volcanic/70 shadow-sm backdrop-blur-sm">
            Islas Canarias · Proyecto de cohesión territorial
          </p>
          <div
            className="mt-5 animate-fade-up rounded-3xl bg-white/80 px-8 py-5 shadow-sm backdrop-blur-md"
            style={{ animationDelay: "80ms" }}
          >
            <LogoFull />
          </div>
          <p
            className="mt-3 max-w-xs animate-fade-up text-sm font-semibold text-volcanic/75 lg:max-w-sm lg:text-base"
            style={{ animationDelay: "520ms" }}
          >
            Tu taxi en el archipiélago canario: ruta real, tarifa clara y tu taxi en vivo en el mapa.
          </p>
          <span className="mt-7 inline-block animate-fade-up" style={{ animationDelay: "680ms" }}>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="cta-pulse btn-shine pointer-events-auto inline-flex items-center gap-2.5 rounded-full bg-taxi px-9 py-4 font-display text-base font-extrabold text-volcanic transition-transform active:scale-95"
            >
              <IconBolt /> Empezar
            </button>
          </span>
          <p
            className="mt-3 animate-fade-up text-[11px] font-bold uppercase tracking-[0.2em] text-volcanic/55"
            style={{ animationDelay: "800ms" }}
          >
            Entrar o crear cuenta
          </p>
        </div>
      )}

      {/* compact form card: top on mobile, right on desktop, scene stays visible */}
      {open && (
      <div className="pointer-events-none relative z-10 flex min-h-screen items-start justify-center px-4 pt-16 lg:items-center lg:justify-end lg:px-[5vw] lg:pt-0">
        <form
          onSubmit={submit}
          noValidate
          className={`pointer-events-auto w-full max-w-[19rem] animate-fade-up rounded-3xl bg-cream/95 p-3.5 text-volcanic shadow-float ring-1 ring-white/60 backdrop-blur-md lg:max-w-[21.5rem] lg:p-5
            ${shake ? "animate-shake" : ""}`}
          style={{ animationDelay: "60ms", maxHeight: "86vh", overflowY: "auto" }}
        >
          {/* logo interactivo — click = mensaje bienvenida */}
          <div className="relative flex items-start justify-between">
            <button
              type="button"
              onClick={() => { setLogoPop(true); setTimeout(() => setLogoPop(false), 1800); }}
              className={`relative flex flex-1 flex-col items-center pb-1 pt-1 transition-transform duration-150 active:scale-95 ${logoPop ? "animate-honk" : ""}`}
              aria-label="CanaryCab"
            >
              {logoPop && (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 animate-pop whitespace-nowrap rounded-full bg-taxi px-3 py-1 text-[11px] font-extrabold text-volcanic shadow-card">
                  {mode === "login" ? "¡Bienvenido de nuevo! 🌴" : "¡Bienvenido a bordo! 🚕"}
                </span>
              )}
              <LogoWordmark height={40} className="transition-transform duration-150 hover:scale-105" />
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-volcanic/40">
                {mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Volver a la portada"
              className="ml-1 mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sand text-volcanic/60 transition-colors hover:bg-taxi hover:text-volcanic"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path d="M6 6 18 18 M18 6 6 18" />
              </svg>
            </button>
          </div>

          {/* tabs with sliding indicator */}
          <div className="relative mb-3 mt-2.5 grid grid-cols-2 rounded-2xl bg-sand p-1">
            <span
              className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-sm transition-transform duration-300 ease-out
                ${mode === "login" ? "translate-x-1" : "translate-x-[calc(100%+3px)]"}`}
            />
            {["login", "register"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`relative z-10 rounded-xl py-2 text-sm font-semibold transition-colors ${
                  mode === m ? "text-volcanic" : "text-volcanic/45"
                }`}
              >
                {m === "login" ? "Entrar" : "Crear cuenta"}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <div className="mb-3 grid grid-cols-2 gap-2">
              {["CLIENTE", "TAXISTA"].map((r) => {
                const active = rol === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRol(r)}
                    className={`relative flex flex-col items-center gap-1 rounded-2xl border-2 px-2 py-2.5 text-sm font-bold transition-all duration-200
                      ${active ? "border-taxi bg-taxi/15 shadow-glow" : "border-sand-deep text-volcanic/45 hover:border-volcanic/25"}`}
                  >
                    {active && (
                      <span className="absolute -right-1.5 -top-1.5 grid h-6 w-6 animate-pop place-items-center rounded-full bg-taxi text-volcanic shadow-sun">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                    )}
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-xl transition-colors
                        ${active ? "bg-volcanic text-taxi" : "bg-sand text-volcanic/40"}`}
                    >
                      {r === "CLIENTE" ? <IconPin /> : <IconCar />}
                    </span>
                    {r === "CLIENTE" ? "Viajo" : "Conduzco"}
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-2.5">
            {mode === "register" && (
              <Input
                label="Nombre"
                name="nombre"
                placeholder="Tu nombre"
                value={form.nombre}
                onChange={set("nombre")}
                onBlur={blur("nombre")}
                error={fieldError("nombre")}
                ok={fieldOk("nombre")}
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
              onBlur={blur("email")}
              error={fieldError("email")}
              ok={fieldOk("email")}
              required
            />
            <div>
              <Input
                label="Contraseña"
                name="password"
                type="password"
                placeholder="mínimo 6 caracteres"
                value={form.password}
                onChange={set("password")}
                onBlur={blur("password")}
                error={fieldError("password")}
                ok={fieldOk("password")}
                minLength={6}
                required
              />
              {mode === "register" && form.password && (
                <div className="mt-2 animate-fade-up">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand-deep/70">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${sMeta.bar} ${sMeta.w}`}
                    />
                  </div>
                  <p className={`mt-1 text-[11px] font-bold uppercase tracking-wider ${sMeta.text}`}>
                    {sMeta.label}
                  </p>
                </div>
              )}
            </div>
            {mode === "register" && (
              <Input
                label="Teléfono (WhatsApp)"
                name="telefono"
                type="tel"
                placeholder="612 34 56 78"
                value={form.telefono}
                onChange={set("telefono")}
              />
            )}
            {mode === "register" && rol === "TAXISTA" && (
              <div className="animate-fade-up space-y-2.5">
                <Input
                  label="Nº de licencia"
                  name="licencia"
                  placeholder="LPA-1234"
                  value={form.licencia}
                  onChange={set("licencia")}
                />
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
              </div>
            )}
          </div>

          {error && (
            <p className="mt-3 animate-fade-up rounded-xl bg-volcanic px-3.5 py-2.5 text-sm font-semibold text-cream">
              ⚠ {error}
            </p>
          )}

          <Button type="submit" full className="mt-4" disabled={busy}>
            {busy ? <Spinner className="border-volcanic/30 border-t-volcanic" /> : <IconBolt />}
            {mode === "login" ? "Entrar" : "Crear cuenta"}
          </Button>
        </form>
      </div>
      )}
    </div>
  );
}
