import { Text } from "@mantine/core";

/** Marca "Cooperativa" na fonte Pacifico (RNF-11 do protótipo). */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Text
      ff="Pacifico, cursive"
      c="teal"
      fw={400}
      fz={compact ? 22 : 26}
      lh={1.2}
      style={{ whiteSpace: "nowrap" }}
    >
      Cooperativa
    </Text>
  );
}
