import { Card, Select, Table, UnstyledButton, Group, Text } from "@mantine/core";
import { useState, type ReactNode } from "react";

export type Col<T> = { t: string; r: (x: T) => ReactNode; o?: (x: T) => string | number };
const cmp = (x: string | number, y: string | number) =>
  typeof x === "number" && typeof y === "number"
    ? x - y
    : String(x).localeCompare(String(y), "pt-BR", { numeric: true, sensitivity: "base" });

type Ord = { i: number; d: 1 | -1 };

function Ordenador<T>({
  cols,
  ord,
  setOrd,
}: {
  cols: Col<T>[];
  ord: Ord | null;
  setOrd: (v: Ord | null) => void;
}) {
  return (
    <Select
      label="Ordenar por"
      aria-label="Ordenar por"
      placeholder="Escolha uma coluna"
      clearable
      data={cols.flatMap((c, i) =>
        c.o
          ? [
              { value: `${i}:1`, label: `${c.t} (crescente)` },
              { value: `${i}:-1`, label: `${c.t} (decrescente)` },
            ]
          : [],
      )}
      value={ord ? `${ord.i}:${ord.d}` : null}
      onChange={(v) => {
        if (!v) return setOrd(null);
        const [i, d] = v.split(":").map(Number);
        setOrd({ i, d: d as 1 | -1 });
      }}
      m="sm"
      miw={220}
    />
  );
}

function Cabecalho<T>({
  cols,
  ord,
  clicar,
}: {
  cols: Col<T>[];
  ord: Ord | null;
  clicar: (i: number) => void;
}) {
  return (
    <Table.Tr>
      {cols.map((c, i) =>
        c.o ? (
          <Table.Th
            key={c.t}
            aria-sort={ord?.i === i ? (ord.d === 1 ? "ascending" : "descending") : "none"}
          >
            <UnstyledButton onClick={() => clicar(i)}>
              <Group gap={4}>
                <Text inherit fw={500}>
                  {c.t}
                </Text>
                <Text component="span" size="xs" c="dimmed">
                  {ord?.i === i ? (ord.d === 1 ? "↑" : "↓") : "↕"}
                </Text>
              </Group>
            </UnstyledButton>
          </Table.Th>
        ) : (
          <Table.Th key={c.t}>{c.t}</Table.Th>
        ),
      )}
    </Table.Tr>
  );
}

/** Tabela ordenável (clique no cabeçalho ou seletor no celular). */
export function Tabela<T>({
  cols,
  rows,
  k,
}: {
  cols: Col<T>[];
  rows: T[];
  k: (x: T) => string | number;
}) {
  const [ord, setOrd] = useState<Ord | null>(null);
  const f = ord ? cols[ord.i]?.o : undefined;
  const lista = ord && f ? [...rows].sort((a, b) => cmp(f(a), f(b)) * ord.d) : rows;
  const clicar = (i: number) => setOrd(ord?.i === i ? { i, d: ord.d === 1 ? -1 : 1 } : { i, d: 1 });
  return (
    <Card withBorder padding={0} mb="md" style={{ overflowX: "auto" }}>
      <Ordenador cols={cols} ord={ord} setOrd={setOrd} />
      <Table horizontalSpacing="sm" verticalSpacing="xs">
        <Table.Thead>
          <Cabecalho cols={cols} ord={ord} clicar={clicar} />
        </Table.Thead>
        <Table.Tbody>
          {lista.map((r) => (
            <Table.Tr key={k(r)}>
              {cols.map((c) => (
                <Table.Td key={c.t}>{c.r(r)}</Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
}
