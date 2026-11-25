import { createTheme, type CSSVariablesResolver, type MantineColorsTuple } from "@mantine/core";

const FONTE = "Inter, system-ui, sans-serif";
// Escala em torno do verde-azulado do protótipo (#17716a no claro, #4cb9aa no escuro).
const brand: MantineColorsTuple = [
  "#e8f7f4",
  "#c9ece6",
  "#a3ddd3",
  "#72cabd",
  "#4cb9aa",
  "#2a9488",
  "#17716a",
  "#115a55",
  "#0b423f",
  "#062a28",
];

/** Tema do Mantine alinhado ao protótipo. A fonte da logo (Pacifico) NÃO entra aqui: ela vem de `p.logo` em styles.css. */
export const theme = createTheme({
  fontFamily: FONTE,
  headings: {
    fontFamily: FONTE,
    fontWeight: "600",
    sizes: {
      h2: { fontSize: "22px", lineHeight: "1.5" },
      h3: { fontSize: "16px", lineHeight: "1.5" },
    },
  },
  colors: { brand },
  primaryColor: "brand",
  primaryShade: { light: 6, dark: 4 },
  defaultRadius: "md",
  fontSizes: { md: "15px" },
});

// Os tokens do protótipo (--bg, --card, --bd...) já trocam entre claro e escuro; o Mantine passa a usá-los.
const tokens = {
  "--mantine-color-body": "var(--bg)",
  "--mantine-color-text": "var(--tx)",
  "--mantine-color-dimmed": "var(--mut)",
  "--mantine-color-default": "var(--card)",
  "--mantine-color-default-hover": "var(--bg)",
  "--mantine-color-default-color": "var(--tx)",
  "--mantine-color-default-border": "var(--bd)",
  "--mantine-color-error": "var(--d)",
  "--mantine-color-placeholder": "var(--mut)",
};
export const resolver: CSSVariablesResolver = () => ({
  variables: {},
  light: tokens,
  dark: tokens,
});
