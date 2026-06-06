// Minimal stroke icons (24x24, currentColor).
const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const IconPin = (p) => (
  <svg {...base} {...p}>
    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
export const IconCar = (p) => (
  <svg {...base} {...p}>
    <path d="M5 11l1.5-4.2A2 2 0 0 1 8.4 5.5h7.2a2 2 0 0 1 1.9 1.3L19 11" />
    <path d="M3 16v-2.2A2 2 0 0 1 4.4 12h15.2A2 2 0 0 1 21 13.8V16a1 1 0 0 1-1 1h-1" />
    <path d="M6 17v1.5M18 17v1.5M5 17h14" />
    <circle cx="7.5" cy="16.5" r="1.3" />
    <circle cx="16.5" cy="16.5" r="1.3" />
  </svg>
);
export const IconList = (p) => (
  <svg {...base} {...p}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <circle cx="3.6" cy="6" r="1.2" />
    <circle cx="3.6" cy="12" r="1.2" />
    <circle cx="3.6" cy="18" r="1.2" />
  </svg>
);
export const IconMenu = (p) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const IconClose = (p) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
export const IconLogout = (p) => (
  <svg {...base} {...p}>
    <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </svg>
);
export const IconBolt = (p) => (
  <svg {...base} {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </svg>
);
