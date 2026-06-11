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
export const IconGear = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.01A1.7 1.7 0 0 0 10 4.09V4a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56h.01a1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.01A1.7 1.7 0 0 0 20.91 11H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" />
  </svg>
);
export const IconPlane = (p) => (
  <svg {...base} {...p}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />
  </svg>
);
export const IconCompass = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="10" />
    <path d="m16.2 7.8-2.2 6.2-6.2 2.2 2.2-6.2 6.2-2.2Z" />
  </svg>
);
