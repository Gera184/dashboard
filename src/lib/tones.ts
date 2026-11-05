// Mirrors the categorical custom properties in globals.css.
export const TONE_HEX = {
  blue: "#3f6fd6",
  purple: "#7356c6",
  pink: "#d4517a",
  amber: "#c98a2b",
  teal: "#13867a",
  gray: "#a2acb8",
  green: "#2e9d6a",
  red: "#c8443b",
} as const;

/** Chart colours shared by every Recharts chart. */
export const CHART = {
  income: "#138a62",
  expense: "#c8443b",
  grid: "#edf0f3",
  axis: "#e3e7ec",
  tick: "#5d6c7f",
  cursor: "rgba(14, 27, 44, 0.05)",
} as const;
