import { Badge, Group, Pagination, Stack, Text, Title } from "@mantine/core";
import dayjs from "dayjs";
import type { ReactNode } from "react";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
/** Exibe valor já calculado pela API; sem aritmética monetária no cliente (D39). */
export const Dinheiro = ({ v }: { v: number }) => (
  <span style={{ fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{brl.format(v)}</span>
);
/** Datas AAAA-MM-DD não passam por new Date() para não deslocar o dia (UTC). */
export const Data = ({ v }: { v?: string | null }) => (
  <>{v ? dayjs(v).format("DD/MM/YYYY") : "—"}</>
);

const COR: Record<string, string> = {
  RASCUNHO: "gray",
  PENDENTE_APROVACAO: "yellow",
  ATIVO: "teal",
  ENCERRADO: "green",
  CANCELADO: "gray",
  PREVISTO: "gray",
  PAGO: "teal",
  REPASSADO: "green",
  ATRASO: "red",
};
const ROT: Record<string, string> = {
  PENDENTE_APROVACAO: "Pendente de aprovação",
  ATRASO: "Em atraso",
};
export const StatusBadge = ({ s }: { s: string }) => (
  <Badge color={COR[s] ?? "gray"} variant="light">
    {ROT[s] ?? s.charAt(0) + s.slice(1).toLowerCase()}
  </Badge>
);

export function PageHeader({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: ReactNode;
}) {
  return (
    <Group justify="space-between" mb="md" wrap="wrap">
      <Stack gap={2}>
        <Title order={2}>{title}</Title>
        {sub && <Text c="dimmed">{sub}</Text>}
      </Stack>
      {actions}
    </Group>
  );
}
export const Paginacao = ({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) =>
  total > 1 ? (
    <Pagination mt="md" value={page + 1} total={total} onChange={(p) => onChange(p - 1)} />
  ) : null;
