const I: Record<string, string> = {
  home: "M4 11l8-7 8 7v9H4z",
  doc: "M7 3h7l4 4v14H7zM14 3v4h4",
  coin: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v10M9.5 9.5h4a1.5 1.5 0 010 3h-3a1.5 1.5 0 000 3h4",
  down: "M7 7l10 10M17 8v9H8",
  chart: "M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3",
  users:
    "M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3 3-5 6-5s6 2 6 5M17 8a2.5 2.5 0 010 5M21 19c0-2-1.5-3.5-4-4",
  user: "M12 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM5 20c0-4 3.5-6 7-6s7 2 7 6",
  brief: "M4 8h16v11H4zM9 8V5h6v3",
  plus: "M12 5v14M5 12h14",
  check: "M5 12l5 5L20 7",
  check2: "M2 12l5 5L17 7M12 16l1 1L22 7",
  x: "M6 6l12 12M18 6L6 18",
  alert: "M12 4l9 16H3zM12 10v4M12 17.5v.01",
  hour: "M6 3h12M6 21h12M7 3c0 6 10 6 10 18M17 3c0 12-10 12-10 18",
  play: "M8 5l11 7-11 7z",
  ban: "M12 3a9 9 0 100 18 9 9 0 000-18zM5.6 5.6l12.8 12.8",
  pen: "M4 20l4-1 11-11-3-3L5 16z",
  cash: "M3 6h18v12H3zM12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z",
  pct: "M19 5L5 19M7 5a2 2 0 100 4 2 2 0 000-4zM17 15a2 2 0 100 4 2 2 0 000-4z",
  wallet: "M3 7a2 2 0 012-2h13v4M3 7v10a2 2 0 002 2h14V9H5a2 2 0 01-2-2z",
  chevL: "M15 6l-6 6 6 6",
};
export const Icone = ({ n }: { n: string }) => (
  <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
    <path d={I[n]} />
  </svg>
);
