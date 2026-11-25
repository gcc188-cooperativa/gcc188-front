import { CORES, Donut } from "../../shared/ui/charts";
import {
  Group,
  Paper,
  Select,
  SimpleGrid,
  Table,
  Tabs,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useState } from "react";
import { api, ok } from "../../shared/api/client";
import { useCooperados } from "../../shared/api/opcoes";
import { Data, Dinheiro, PageHeader, StatusBadge } from "../../shared/ui";
import { useSession } from "../auth/session";

const Cartao = ({ t, v }: { t: string; v: number }) => (
  <Paper withBorder p="md">
    <Text c="dimmed" size="sm">
      {t}
    </Text>
    <Title order={3}>
      <Dinheiro v={v} />
    </Title>
  </Paper>
);

function ResumoCards({ q }: { q: { data_inicio: string; data_fim: string } }) {
  const { data: r } = useQuery({
    queryKey: ["rel-resumo", q],
    queryFn: async () =>
      ok(await api.GET("/relatorios/resumo-financeiro", { params: { query: q } })),
  });
  if (!r) return null;
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
      <Cartao t="Taxas arrecadadas" v={r.taxas_arrecadadas} />
      <Cartao t="A repassar" v={r.a_repassar} />
      <Cartao t="Repassado" v={r.repassado} />
      <Cartao t="Despesas da cooperativa" v={r.despesas_cooperativa} />
      <Cartao t="Saldo (taxas − despesas)" v={r.saldo} />
    </SimpleGrid>
  );
}
function Resumo({ q }: { q: { data_inicio: string; data_fim: string } }) {
  const { data: r } = useQuery({
    queryKey: ["rel-resumo", q],
    queryFn: async () =>
      ok(await api.GET("/relatorios/resumo-financeiro", { params: { query: q } })),
  });
  return (
    <div>
      <ResumoCards q={q} />
      {r && (
        <div style={{ marginTop: 16, maxWidth: 520 }}>
          <Donut
            titulo="Destino do valor recebido"
            fatias={[
              { nome: "Taxa da cooperativa", valor: r.taxas_arrecadadas, cor: CORES[1] },
              { nome: "A repassar", valor: r.a_repassar, cor: CORES[3] },
              { nome: "Repassado", valor: r.repassado, cor: CORES[0] },
            ]}
          />
        </div>
      )}
    </div>
  );
}
function Extrato({ q }: { q: { data_inicio: string; data_fim: string } }) {
  const { user } = useSession();
  const mot = user!.papel === "MOTORISTA";
  const coops = useCooperados(!mot);
  const [sel, setSel] = useState<string | null>(null);
  const id = mot ? user!.vinculo_id : sel ? Number(sel) : null;
  const { data: e } = useQuery({
    queryKey: ["rel-extrato", id, q],
    enabled: !!id,
    queryFn: async () =>
      ok(await api.GET("/cooperados/{id}/extrato", { params: { path: { id: id! }, query: q } })),
  });
  return (
    <>
      {!mot && (
        <Select
          mb="md"
          label="Cooperado"
          searchable
          data={coops.data ?? []}
          value={sel}
          onChange={setSel}
          maw={360}
        />
      )}
      {e && (
        <>
          <SimpleGrid cols={{ base: 2, md: 4 }} mb="md">
            <Cartao t="Bruto" v={e.total_bruto} />
            <Cartao t="Taxa" v={e.total_taxa} />
            <Cartao t="Líquido" v={e.total_liquido} />
            <Cartao t="Despesas" v={e.total_despesas} />
          </SimpleGrid>
          <Table.ScrollContainer minWidth={500}>
            <Table>
              <Table.Tbody>
                {e.pagamentos.map((p) => (
                  <Table.Tr key={`p${p.pagamento_id}`}>
                    <Table.Td>
                      <Data v={p.data_vencimento} />
                    </Table.Td>
                    <Table.Td>
                      Contrato {p.contrato_id} · parcela {p.numero_parcela}
                    </Table.Td>
                    <Table.Td>
                      <Dinheiro v={p.valor_liquido} />
                    </Table.Td>
                    <Table.Td>
                      <StatusBadge s={p.status} />
                    </Table.Td>
                  </Table.Tr>
                ))}
                {e.despesas.map((d) => (
                  <Table.Tr key={`d${d.id}`}>
                    <Table.Td>
                      <Data v={d.data_despesa} />
                    </Table.Td>
                    <Table.Td>
                      {d.categoria} · {d.descricao}
                    </Table.Td>
                    <Table.Td>
                      <Dinheiro v={d.valor} />
                    </Table.Td>
                    <Table.Td>Despesa</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </>
      )}
    </>
  );
}
function Inadimplencia() {
  const { data: r } = useQuery({
    queryKey: ["rel-inad"],
    queryFn: async () => ok(await api.GET("/relatorios/inadimplencia")),
  });
  if (!r) return null;
  if (!r.por_cliente.length) return <Text>Nenhum pagamento em atraso.</Text>;
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Cliente</Table.Th>
          <Table.Th>Parcelas</Table.Th>
          <Table.Th>Valor em atraso</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {r.por_cliente.map((c) => (
          <Table.Tr key={c.cliente.id}>
            <Table.Td>{c.cliente.nome}</Table.Td>
            <Table.Td>{c.quantidade}</Table.Td>
            <Table.Td>
              <Dinheiro v={c.valor_total} />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

export function RelatoriosPage() {
  const { user } = useSession();
  const mot = user!.papel === "MOTORISTA";
  const [q, setQ] = useState({
    data_inicio: dayjs().startOf("month").format("YYYY-MM-DD"),
    data_fim: dayjs().endOf("month").format("YYYY-MM-DD"),
  });
  return (
    <>
      <PageHeader title="Relatórios" sub="Escolha o período e o tipo de relatório." />
      <Group mb="md">
        <TextInput
          type="date"
          label="De"
          value={q.data_inicio}
          onChange={(e) => setQ({ ...q, data_inicio: e.currentTarget.value })}
        />
        <TextInput
          type="date"
          label="Até"
          value={q.data_fim}
          onChange={(e) => setQ({ ...q, data_fim: e.currentTarget.value })}
        />
      </Group>
      <Tabs defaultValue={mot ? "extrato" : "resumo"}>
        <Tabs.List mb="md">
          {!mot && <Tabs.Tab value="resumo">Resumo financeiro</Tabs.Tab>}
          <Tabs.Tab value="extrato">{mot ? "Meu extrato" : "Extrato do cooperado"}</Tabs.Tab>
          {!mot && <Tabs.Tab value="inad">Inadimplência</Tabs.Tab>}
        </Tabs.List>
        {!mot && (
          <Tabs.Panel value="resumo">
            <Resumo q={q} />
          </Tabs.Panel>
        )}
        <Tabs.Panel value="extrato">
          <Extrato q={q} />
        </Tabs.Panel>
        {!mot && (
          <Tabs.Panel value="inad">
            <Inadimplencia />
          </Tabs.Panel>
        )}
      </Tabs>
    </>
  );
}
