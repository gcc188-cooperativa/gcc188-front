import { Card, Group, List, Text, Title } from "@mantine/core";
import { Dinheiro } from "./index";

export type Fatia = { nome: string; valor: number; cor: string; op?: number };
export const COR = {
  l: "var(--mantine-color-teal-6)",
  t: "var(--mantine-color-blue-6)",
  d: "var(--mantine-color-red-6)",
};

type DonutProps = {
  titulo: string;
  fatias: Fatia[];
  centro: string;
  sub: string;
};

function Rosca({ titulo, fatias, centro, sub }: DonutProps) {
  const total = fatias.reduce((s, f) => s + f.valor, 0) || 1;
  let off = 25;
  return (
    <svg
      viewBox="0 0 42 42"
      role="img"
      aria-label={`${titulo}: ${fatias.map((f) => `${f.nome} ${f.valor}`).join(", ")}`}
      style={{ width: 150, height: 150, flex: "none" }}
    >
      <circle
        cx="21"
        cy="21"
        r="15.9155"
        fill="none"
        stroke="var(--mantine-color-default-border)"
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
            strokeOpacity={f.op ?? 1}
            strokeWidth="5"
            strokeDasharray={`${k} ${100 - k}`}
            strokeDashoffset={o}
          />
        );
      })}
      <text x="21" y="21.5" textAnchor="middle" fontSize="4.6" fontWeight="600">
        {centro}
      </text>
      <text x="21" y="26" textAnchor="middle" fontSize="2.6" fill="currentColor">
        {sub}
      </text>
    </svg>
  );
}

function Legenda({ fatias, total }: { fatias: Fatia[]; total: number }) {
  return (
    <List spacing="xs" size="sm" style={{ flex: 1, minWidth: 150 }}>
      {fatias.map((f) => (
        <List.Item key={f.nome}>
          <Group gap={6} wrap="nowrap">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: f.cor,
                opacity: f.op ?? 1,
              }}
            />
            <Text span>{f.nome}</Text>
          </Group>
          <Text size="sm">
            <b>
              <Dinheiro v={f.valor} />
            </b>{" "}
            <Text span c="dimmed">
              {Math.round((f.valor / total) * 100)}%
            </Text>
          </Text>
        </List.Item>
      ))}
    </List>
  );
}

/** Rosca com texto central e legenda com valor e percentual. */
export function Donut({ titulo, fatias, centro, sub }: DonutProps) {
  const total = fatias.reduce((s, f) => s + f.valor, 0) || 1;
  return (
    <Card withBorder padding="lg">
      <Title order={3} mb="sm">
        {titulo}
      </Title>
      <Group align="flex-start" gap="lg" wrap="nowrap">
        <Rosca titulo={titulo} fatias={fatias} centro={centro} sub={sub} />
        <Legenda fatias={fatias} total={total} />
      </Group>
    </Card>
  );
}
