import { Anchor, Group, Paper, SimpleGrid, Table, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, ok } from "../../shared/api/client";
import { Data, Dinheiro, PageHeader, StatusBadge } from "../../shared/ui";
import { useSession } from "../auth/session";

const Cartao = ({ t, v }: { t: string; v: React.ReactNode }) => (
  <Paper withBorder p="md">
    <Text c="dimmed" size="sm">
      {t}
    </Text>
    <Title order={3}>{v}</Title>
  </Paper>
);

export function PainelPage() {
  const { user } = useSession();
  const { data: i } = useQuery({
    queryKey: ["indicadores"],
    queryFn: async () => ok(await api.GET("/painel/indicadores")),
  });
  if (!i) return null;
  const val = (x?: { valor: number; quantidade: number }) => (x ? <Dinheiro v={x.valor} /> : null);
  return (
    <>
      <PageHeader title={`Olá, ${user!.nome}`} sub="Resumo do que precisa da sua atenção." />
      {i.contratos_pendentes_aprovacao ? (
        <Group mb="md">
          <Text>{i.contratos_pendentes_aprovacao} contrato(s) aguardam aprovação.</Text>
          <Anchor component={Link} to="/contratos">
            Revisar
          </Anchor>
        </Group>
      ) : null}
      <SimpleGrid cols={{ base: 2, md: 4 }} mb="lg">
        {i.contratos_ativos !== undefined && <Cartao t="Contratos ativos" v={i.contratos_ativos} />}
        {i.pagamentos_a_receber && <Cartao t="A receber" v={val(i.pagamentos_a_receber)} />}
        {i.pagamentos_em_atraso && <Cartao t="Em atraso" v={val(i.pagamentos_em_atraso)} />}
        {i.pagamentos_a_repassar && <Cartao t="A repassar" v={val(i.pagamentos_a_repassar)} />}
      </SimpleGrid>
      <Group justify="space-between" mb="xs">
        <Title order={4}>Próximos vencimentos</Title>
        <Anchor component={Link} to="/pagamentos">
          Ver todos
        </Anchor>
      </Group>
      {!i.proximos_vencimentos?.length ? (
        <Text c="dimmed">Nenhum vencimento próximo.</Text>
      ) : (
        <Table.ScrollContainer minWidth={420}>
          <Table>
            <Table.Tbody>
              {i.proximos_vencimentos.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>
                    <Anchor component={Link} to={`/contratos/${p.contrato_id}`}>
                      {String(p.contrato_id).padStart(4, "0")}
                    </Anchor>{" "}
                    · parcela {p.numero_parcela}
                  </Table.Td>
                  <Table.Td>
                    <Data v={p.data_vencimento} />
                  </Table.Td>
                  <Table.Td>
                    <Dinheiro v={p.valor_bruto} />
                  </Table.Td>
                  <Table.Td>
                    <StatusBadge s={p.status} />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
    </>
  );
}
