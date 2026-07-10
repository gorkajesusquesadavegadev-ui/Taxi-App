// SVGs de la postal de portada — portados 1:1 de frontend/src/pages/Auth.jsx.
import Svg, { Path, Rect, Circle, Ellipse, Text as SvgText } from "react-native-svg";

export function TaxiSvg({ width = 120 }) {
  const h = (width / 120) * 64;
  return (
    <Svg width={width} height={h} viewBox="0 0 120 64" fill="none">
      <Rect x="50" y="2" width="20" height="10" rx="3" fill="#0B2E4F" />
      <SvgText x="60" y="10" textAnchor="middle" fontSize="7" fontWeight="800" fill="#FFC400">TAXI</SvgText>
      <Path d="M34 28 Q38 12 56 12 L72 12 Q88 12 93 28 Z" fill="#FFC400" />
      <Path d="M42 26 Q45 16 56 16 L62 16 L62 26 Z" fill="#BFE0F5" />
      <Path d="M66 26 L66 16 L71 16 Q83 16 87 26 Z" fill="#BFE0F5" />
      <Rect x="14" y="26" width="92" height="22" rx="10" fill="#FFC400" />
      <Rect x="14" y="33" width="92" height="6" fill="#0B2E4F" opacity="0.9" />
      <Circle cx="104" cy="36" r="3" fill="#FFF8E3" />
      <Circle cx="16" cy="36" r="2.5" fill="#0B5C9E" />
      <Circle cx="36" cy="50" r="9" fill="#0B2E4F" />
      <Circle cx="36" cy="50" r="3.5" fill="#F7FBFE" />
      <Circle cx="84" cy="50" r="9" fill="#0B2E4F" />
      <Circle cx="84" cy="50" r="3.5" fill="#F7FBFE" />
    </Svg>
  );
}

export function FerrySvg({ width = 210 }) {
  const h = (width / 250) * 100;
  return (
    <Svg width={width} height={h} viewBox="0 0 250 100" fill="none">
      <Rect x="58" y="20" width="112" height="16" rx="5" fill="#FFFFFF" />
      <Rect x="64" y="24" width="100" height="7" rx="3.5" fill="#4AA3DD" />
      <Path d="M196 20 q15 4 11 18 h-15 Z" fill="#FFC400" />
      <Rect x="40" y="36" width="172" height="24" rx="5" fill="#F7FBFE" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Rect key={i} x={52 + i * 20} y="42" width="11" height="8" rx="2" fill="#4AA3DD" />
      ))}
      <Path d="M8 60 H246 L224 88 Q125 96 34 88 Z" fill="#FFFFFF" />
      <Rect x="22" y="63" width="212" height="5" rx="2.5" fill="#1577C2" />
      <SvgText x="127" y="83" textAnchor="middle" fontSize="13" fontStyle="italic" fontWeight="800" fill="#0B5C9E">
        Islas Canarias
      </SvgText>
    </Svg>
  );
}

export function FarFerrySvg() {
  return (
    <Svg width="108" height="44" viewBox="0 0 110 44" fill="none" style={{ transform: [{ scaleX: -1 }] }}>
      <Rect x="26" y="10" width="56" height="10" rx="3" fill="#F7FBFE" />
      <Path d="M4 20 H106 L94 38 Q55 44 16 38 Z" fill="#FFFFFF" />
      <Rect x="12" y="24" width="86" height="3" fill="#1577C2" />
      <Path d="M70 8 q8 2 6 12 h-9 Z" fill="#FFC400" />
    </Svg>
  );
}

export function PlaneSvg({ width = 110 }) {
  const h = (width / 170) * 64;
  return (
    <Svg width={width} height={h} viewBox="0 0 170 64" fill="none">
      <Path d="M16 32 L2 6 H26 L38 30 Z" fill="#1577C2" />
      <Path d="M10 12 q8 -3 14 6 l-4 8 q-8 -4 -10 -14 Z" fill="#4AA3DD" opacity="0.7" />
      <Rect x="10" y="27" width="132" height="17" rx="8.5" fill="#FFFFFF" />
      <Path d="M142 27 q20 4.5 24 8.5 q-4 4 -24 8.5 Z" fill="#FFFFFF" />
      <Rect x="14" y="40" width="126" height="3.4" rx="1.7" fill="#1577C2" />
      <Path d="M70 34 l-22 18 h-12 l14 -18 Z" fill="#4AA3DD" />
      <Path d="M74 30 l-18 -16 h-11 l11 16 Z" fill="#BFE0F5" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Circle key={i} cx={38 + i * 12} cy="33" r="2.1" fill="#4AA3DD" />
      ))}
      <Path d="M142 29 q7 2.5 8 6" stroke="#BFE0F5" strokeWidth="2" />
    </Svg>
  );
}

export function Gull() {
  return (
    <Svg width="26" height="12" viewBox="0 0 26 12" fill="none">
      <Path d="M1 9 Q7 1 13 8 Q19 1 25 9" stroke="#0B2E4F" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Ola: patrón 2880×120 (se pinta al doble de ancho de pantalla y se desplaza). */
export function WaveSvg({ width, height = 56, fill, opacity = 1 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 2880 120" preserveAspectRatio="none">
      <Path
        d="M0,60 C240,18 480,102 720,60 C960,18 1200,102 1440,60 C1680,18 1920,102 2160,60 C2400,18 2640,102 2880,60 L2880,120 L0,120 Z"
        fill={fill}
        opacity={opacity}
      />
    </Svg>
  );
}

export function PalmSvg({ h = 92 }) {
  return (
    <Svg width={h * 0.72} height={h} viewBox="0 0 72 100" fill="none">
      <Path d="M36 100 Q31 62 40 32" stroke="#0B2E4F" strokeWidth="7" strokeLinecap="round" />
      <Path d="M40 32 Q22 18 6 24 Q24 32 40 36 Z" fill="#1577C2" />
      <Path d="M40 32 Q58 18 70 26 Q54 33 40 36 Z" fill="#1577C2" />
      <Path d="M40 32 Q30 12 14 8 Q30 22 40 34 Z" fill="#4AA3DD" />
      <Path d="M40 32 Q52 12 66 10 Q52 24 40 34 Z" fill="#4AA3DD" />
      <Path d="M40 32 Q40 8 32 2 Q46 12 42 34 Z" fill="#1577C2" />
      <Circle cx="38" cy="36" r="3.4" fill="#FFC400" />
      <Circle cx="44" cy="37" r="3" fill="#FFC400" />
    </Svg>
  );
}

export function TeideSvg() {
  return (
    <Svg width="90" height="100" viewBox="0 0 90 100" fill="none">
      <Path d="M0 100 Q20 55 45 8 Q70 55 90 100 Z" fill="#5B3A29" />
      <Path d="M24 100 Q38 62 45 8 L45 100 Z" fill="#7A4A34" opacity="0.4" />
      <Path d="M45 8 Q40 18 37 24 Q45 18 53 24 Q50 18 45 8 Z" fill="#FFFFFF" />
      <Ellipse cx="66" cy="42" rx="15" ry="6" fill="white" opacity="0.6" />
    </Svg>
  );
}

export function DunasSvg() {
  return (
    <Svg width="190" height="74" viewBox="0 0 190 74" fill="none">
      <Path d="M0 74 Q46 14 96 50 Q130 70 190 74 Z" fill="#FFC400" />
      <Path d="M52 74 Q120 4 190 60 L190 74 Z" fill="#FFE9A6" />
      <Path d="M0 74 Q46 14 96 50 L96 74 Z" fill="#E8AF00" opacity="0.5" />
      <Path d="M14 62 Q46 26 88 48" stroke="#E8AF00" strokeWidth="2" opacity="0.7" />
      <Path d="M86 66 Q130 26 178 58" stroke="#FFF3C4" strokeWidth="2" opacity="0.85" />
    </Svg>
  );
}

export function RoqueSvg() {
  return (
    <Svg width="120" height="92" viewBox="0 0 120 92" fill="none">
      <Path d="M0 92 Q28 58 58 52 Q94 46 120 92 Z" fill="#11395F" />
      <Path d="M50 54 L55 14 Q57 6 63 8 L69 12 L66 54 Z" fill="#0B2E4F" />
      <Path d="M55 14 Q57 6 63 8 L61 50 L55 52 Z" fill="#4AA3DD" opacity="0.3" />
    </Svg>
  );
}

export function FaroSvg() {
  return (
    <Svg width="46" height="110" viewBox="0 0 46 110" fill="none">
      <Rect x="14" y="22" width="18" height="78" fill="#FFFFFF" stroke="#0B2E4F" strokeWidth="1.5" />
      {[0, 1, 2, 3].map((i) => (
        <Rect key={i} x="14" y={40 + i * 16} width="18" height="7" fill="#E03131" opacity="0.65" />
      ))}
      <Rect x="10" y="12" width="26" height="12" rx="3" fill="#FFC400" />
      <Rect x="8" y="10" width="30" height="4" rx="2" fill="#0B2E4F" />
      <Circle cx="23" cy="18" r="4" fill="white" opacity="0.9" />
      <Rect x="8" y="98" width="30" height="12" rx="2" fill="#0B2E4F" />
      <Rect x="16" y="2" width="1.5" height="10" fill="#0B2E4F" />
      <Path d="M17.5 2 l10 3.5 l-10 3.5 Z" fill="#FFC400" />
    </Svg>
  );
}

export function TimanfayaSvg() {
  return (
    <Svg width="100" height="72" viewBox="0 0 100 72" fill="none">
      <Path d="M0 72 Q20 38 50 28 Q80 38 100 72 Z" fill="#1a0a05" />
      <Path d="M18 72 Q36 45 50 28 L50 72 Z" fill="#3d1505" opacity="0.5" />
      <Ellipse cx="33" cy="50" rx="10" ry="6" fill="#8B2500" opacity="0.85" />
      <Ellipse cx="67" cy="45" rx="8" ry="5" fill="#B83000" opacity="0.8" />
      <Path d="M33 44 C30 34 34 26 33 22" stroke="#888" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      <Path d="M67 39 C65 28 70 20 69 16" stroke="#888" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </Svg>
  );
}
