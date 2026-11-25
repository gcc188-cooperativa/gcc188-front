import { Card, Text } from "@mantine/core";
import { Dinheiro } from "./index";

export type Fatia = { nome: string; valor: number; cor: string };
export const CORES = [
  "var(--mantine-color-teal-6)",
  "var(--mantine-color-blue-6)",
  "var(--mantine-color-red-6)",
  "var(--mantine-color-yellow-6)",
  "var(--mantine-color-grape-6)",
  "var(--mantine-color-gray-6)",
];

/** Rosca acessível: o rótulo textual traz todos os valores; a legenda repete os números. */
export function Donut({ titulo, fatias }: { titulo: string; fatias: Fatia[] }) {
  const total = fatias.reduce((s, f) => s + f.valor, 0) || 1;
  let off = 25;
  return (
    <Card withBorder>
      <Text fw={600} mb="xs">
        {titulo}
      </Text>
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <svg
          viewBox="0 0 42 42"
          width={140}
          height={140}
          role="img"
          aria-label={`${titulo}: ${fatias.map((f) => `${f.nome} ${f.valor}`).join(", ")}`}
        >
          <circle
            cx="21"
            cy="21"
            r="15.9155"
            fill="none"
            stroke="var(--mantine-color-gray-3)"
            strokeWidth="5"
          />
          {fatias.map((f) => {
            const k = (f.valor / total) * 100,
              o = off;
            off -= k;
            return (
              <circle
                key={f.nome}
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                stroke={f.cor}
                strokeWidth="5"
                strokeDasharray={`${k} ${100 - k}`}
                strokeDashoffset={o}
              />
            );
          })}
        </svg>
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {fatias.map((f) => (
            <li key={f.nome}>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: f.cor,
                  marginRight: 6,
                }}
              />
              {f.nome}: <Dinheiro v={f.valor} />{" "}
              <Text span c="dimmed" size="sm">
                {Math.round((f.valor / total) * 100)}%
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
