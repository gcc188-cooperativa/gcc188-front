import { createTheme } from "@mantine/core";

/** Tema único da SPA; a logo usa a fonte Pacifico carregada em `index.html`. */
export const theme = createTheme({
  primaryColor: "teal",
  fontFamily: "Inter, system-ui, sans-serif",
  headings: { fontFamily: "Inter, system-ui, sans-serif" },
  defaultRadius: "md",
  other: { logoFont: "Pacifico, cursive" },
});
