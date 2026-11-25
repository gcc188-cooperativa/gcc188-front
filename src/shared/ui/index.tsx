import {
  Alert,
  Badge,
  Card,
  Group,
  Pagination,
  Stack,
  Text,
  Title,
  type MantineColor,
} from "@mantine/core";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { Icone } from "./icons";
import { numero } from "./numero";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const reais = (v: number) => brl.format(numero(v));
/** Exibe valor já calculado pela API (D39); valor inválido não vira "R$ NaN". */
export const Dinheiro = ({ v, c = "" }: { v: number; c?: string }) => (
  <Text
    component="span"
    c={({ b: "dark", d: "red", t: "blue", l: "teal" } as Record<string, MantineColor>)[c]}
    style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}
  >
    {reais(v)}
  </Text>
);
/** Datas AAAA-MM-DD não passam por new Date() para não deslocar o dia (UTC). */
export const Data = ({ v }: { v?: string | null }) => (
  <>{v ? dayjs(v).format("DD/MM/YYYY") : "—"}</>
);

const S: Record<string, [MantineColor, string, string]> = {
  RASCUNHO: ["gray", "pen", "Rascunho"],
  PENDENTE_APROVACAO: ["yellow", "hour", "Pendente de aprovação"],
  ATIVO: ["teal", "play", "Ativo"],
  ENCERRADO: ["green", "check2", "Encerrado"],
  CANCELADO: ["gray", "ban", "Cancelado"],
  PREVISTO: ["gray", "hour", "Previsto"],
  PAGO: ["teal", "check", "Pago"],
  REPASSADO: ["green", "check2", "Repassado"],
  ATRASO: ["red", "alert", "Em atraso"],
  INATIVO: ["gray", "ban", "Inativo"],
};
export const rotuloStatus = (s: string) => S[s]?.[2] ?? s;
export const StatusBadge = ({ s }: { s: string }) => {
  const [cor, ic, rot] = S[s] ?? ["gray", "ban", s];
  return (
    <Badge color={cor} variant="light" leftSection={<Icone n={ic} />}>
      {rot}
    </Badge>
  );
};
export const PAPEL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  FINANCEIRO: "Financeiro",
  MOTORISTA: "Motorista",
  CLIENTE: "Cliente",
};
export const CATEGORIA: Record<string, string> = {
  COMBUSTIVEL: "Combustível",
  PEDAGIO: "Pedágio",
  MANUTENCAO: "Manutenção",
  ADMINISTRATIVA: "Administrativa",
  TRIBUTOS: "Tributos",
  OUTROS: "Outros",
};

export const PageHeader = ({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: ReactNode;
}) => (
  <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
    <Stack gap={2}>
      <Title order={2}>{title}</Title>
      {sub && (
        <Text c="dimmed" size="sm">
          {sub}
        </Text>
      )}
    </Stack>
    {actions && <Group gap="xs">{actions}</Group>}
  </Group>
);
export const Kpi = ({ i, l, v, c = "" }: { i: string; l: string; v: ReactNode; c?: string }) => (
  <Card withBorder padding="md">
    <Group gap="xs" mb={4}>
      <Text c="dimmed" size="sm" className={c === "d" ? "d" : undefined}>
        <Icone n={i} /> {l}
      </Text>
    </Group>
    <Text fw={600} fz="xl" c={({ d: "red", l: "teal" } as Record<string, MantineColor>)[c]}>
      {v}
    </Text>
  </Card>
);
export const Nota = ({ children }: { children: ReactNode }) => (
  <Alert color="teal" variant="light" mb="md">
    {children}
  </Alert>
);
export const Cartao = ({ t, children }: { t?: string; children: ReactNode }) => (
  <Card withBorder padding="lg" mb="md">
    {t && (
      <Title order={3} mb="sm">
        {t}
      </Title>
    )}
    {children}
  </Card>
);
export const Secao = ({ t, aside }: { t: string; aside?: ReactNode }) => (
  <Group justify="space-between" align="baseline" mt="lg" mb="xs">
    <Title order={3}>{t}</Title>
    {aside}
  </Group>
);
export function Paginacao({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  return total > 1 ? (
    <Pagination
      mt="md"
      value={page + 1}
      total={total}
      onChange={(p) => onChange(p - 1)}
      aria-label="Paginação"
    />
  ) : null;
}
