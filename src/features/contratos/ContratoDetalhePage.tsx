import { Button, Card, Group, SimpleGrid, Table, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { api, msgErro, ok } from "../../shared/api/client";
import { acoesDisponiveis, pode, type AcaoContrato } from "../../shared/permissions";
import { Data, Dinheiro, PageHeader, StatusBadge } from "../../shared/ui";
import { useSession } from "../auth/session";

const ROTULO: Record<AcaoContrato, string> = {
  editar: "Editar",
  submeter: "Submeter à aprovação",
  excluir: "Excluir rascunho",
  aprovar: "Aprovar",
  reprovar: "Reprovar",
  encerrar: "Encerrar",
  cancelar: "Cancelar contrato",
};
const IRREVERSIVEL: AcaoContrato[] = ["excluir", "cancelar", "encerrar", "aprovar"];

export function ContratoDetalhePage() {
  const id = Number(useParams().id);
  const { user } = useSession();
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data: c } = useQuery({
    queryKey: ["contrato", id],
    queryFn: async () => ok(await api.GET("/contratos/{id}", { params: { path: { id } } })),
  });
  if (!c) return null;
  const p = { path: { id } };

  async function executar(a: AcaoContrato) {
    let r: { error?: unknown };
    if (a === "excluir") r = await api.DELETE("/contratos/{id}", { params: p });
    else if (a === "reprovar") {
      const motivo = window.prompt("Motivo da reprovação:");
      if (!motivo) return;
      r = await api.POST("/contratos/{id}/reprovacao", { params: p, body: { motivo } });
    } else if (a === "submeter") r = await api.POST("/contratos/{id}/submissao", { params: p });
    else if (a === "aprovar") r = await api.POST("/contratos/{id}/aprovacao", { params: p });
    else if (a === "encerrar") r = await api.POST("/contratos/{id}/encerramento", { params: p });
    else if (a === "cancelar") r = await api.POST("/contratos/{id}/cancelamento", { params: p });
    else {
      nav(`/contratos/${id}/editar`);
      return;
    }
    if (r.error) {
      notifications.show({ color: "red", message: msgErro(r.error) });
      qc.invalidateQueries({ queryKey: ["contrato", id] });
      return;
    }
    notifications.show({ color: "teal", message: `${ROTULO[a]}: concluído.` });
    qc.invalidateQueries({ queryKey: ["contrato", id] });
    qc.invalidateQueries({ queryKey: ["contratos"] });
    if (a === "excluir") nav("/contratos");
  }
  const pedir = (a: AcaoContrato) =>
    IRREVERSIVEL.includes(a)
      ? modals.openConfirmModal({
          title: `${ROTULO[a]}?`,
          children: <Text size="sm">Esta ação pode não ter volta. Deseja continuar?</Text>,
          labels: { confirm: "Confirmar", cancel: "Voltar" },
          onConfirm: () => executar(a),
        })
      : executar(a);

  const acoes = acoesDisponiveis(c, user!.papel, user!.usuario_id);
  const taxa = pode.verTaxa(user!.papel);
  return (
    <>
      <PageHeader
        title={`Contrato ${String(c.id).padStart(4, "0")}`}
        sub={c.descricao}
        actions={<StatusBadge s={c.status} />}
      />
      <Group mb="md">
        {acoes.map((a) => (
          <Button
            key={a}
            variant={a === "cancelar" || a === "excluir" ? "outline" : "filled"}
            color={a === "cancelar" || a === "excluir" ? "red" : undefined}
            onClick={() => pedir(a)}
          >
            {ROTULO[a]}
          </Button>
        ))}
        {!acoes.length && (
          <Text c="dimmed">Nenhuma ação disponível para o seu perfil neste estado.</Text>
        )}
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2 }} mb="md">
        <Card withBorder>
          <Text fw={600}>Partes</Text>
          <Text>Cliente: {c.cliente.nome}</Text>
          <Text>Cooperado: {c.cooperado.nome}</Text>
          <Text>
            Modalidade:{" "}
            {c.modalidade === "MENSAL" ? `Mensal, ${c.num_parcelas} parcelas` : "Pagamento único"}
          </Text>
        </Card>
        <Card withBorder>
          <Text fw={600}>Valores</Text>
          <Text>
            Total: <Dinheiro v={c.valor_total} />
          </Text>
          {taxa && (
            <Text>
              Taxa:{" "}
              {c.taxa_tipo === "PERCENTUAL" ? `${c.taxa_valor}%` : <Dinheiro v={c.taxa_valor} />}
            </Text>
          )}
          {c.motivo_reprovacao && <Text c="red">Reprovado: {c.motivo_reprovacao}</Text>}
        </Card>
      </SimpleGrid>
      <Text fw={600} mb="xs">
        Cronograma de pagamentos
      </Text>
      {c.pagamentos.length === 0 ? (
        <Text c="dimmed">Os pagamentos são gerados quando o contrato é aprovado.</Text>
      ) : (
        <Table.ScrollContainer minWidth={500}>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Parcela</Table.Th>
                <Table.Th>Vencimento</Table.Th>
                <Table.Th>Bruto</Table.Th>
                {taxa && (
                  <>
                    <Table.Th>Taxa</Table.Th>
                    <Table.Th>Líquido</Table.Th>
                  </>
                )}
                <Table.Th>Situação</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {c.pagamentos.map((x) => (
                <Table.Tr key={x.id}>
                  <Table.Td>{x.numero_parcela}</Table.Td>
                  <Table.Td>
                    <Data v={x.data_vencimento} />
                  </Table.Td>
                  <Table.Td>
                    <Dinheiro v={x.valor_bruto} />
                  </Table.Td>
                  {taxa && (
                    <>
                      <Table.Td>
                        <Dinheiro v={x.valor_taxa} />
                      </Table.Td>
                      <Table.Td>
                        <Dinheiro v={x.valor_liquido} />
                      </Table.Td>
                    </>
                  )}
                  <Table.Td>
                    <StatusBadge s={x.status} />
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
