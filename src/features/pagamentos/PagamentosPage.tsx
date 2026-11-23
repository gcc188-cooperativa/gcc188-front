import { Anchor, Button, Checkbox, Group, Table } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api, msgErro, ok } from "../../shared/api/client";
import { pode } from "../../shared/permissions";
import { Data, Dinheiro, PageHeader, Paginacao, StatusBadge } from "../../shared/ui";
import { useSession } from "../auth/session";

export function PagamentosPage() {
  const { user } = useSession();
  const papel = user!.papel;
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [atraso, setAtraso] = useState(false);
  const { data } = useQuery({
    queryKey: ["pagamentos", page, atraso],
    queryFn: async () =>
      ok(
        await api.GET("/pagamentos", {
          params: {
            query: {
              page,
              size: 20,
              sort: "data_vencimento,asc",
              ...(atraso ? { em_atraso: true } : {}),
            },
          },
        }),
      ),
  });

  const hoje = () => dayjs().format("YYYY-MM-DD");
  function agir(titulo: string, fn: () => Promise<{ error?: unknown }>) {
    modals.openConfirmModal({
      title: `${titulo}?`,
      labels: { confirm: "Confirmar", cancel: "Voltar" },
      onConfirm: async () => {
        const r = await fn();
        if (r.error) notifications.show({ color: "red", message: msgErro(r.error) });
        else {
          notifications.show({ color: "teal", message: `${titulo}: concluído.` });
          qc.invalidateQueries({ queryKey: ["pagamentos"] });
        }
      },
    });
  }
  const verTaxa = pode.verTaxa(papel);
  return (
    <>
      <PageHeader
        title="Pagamentos"
        sub={pode.baixaRepasse(papel) ? "Registre baixas e repasses." : "Parcelas dos contratos."}
      />
      <Checkbox
        mb="md"
        label="Somente em atraso"
        checked={atraso}
        onChange={(e) => {
          setAtraso(e.currentTarget.checked);
          setPage(0);
        }}
      />
      <Table.ScrollContainer minWidth={700}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Contrato</Table.Th>
              <Table.Th>Parcela</Table.Th>
              <Table.Th>Vencimento</Table.Th>
              <Table.Th>Bruto</Table.Th>
              {verTaxa && <Table.Th>Líquido</Table.Th>}
              <Table.Th>Situação</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.content.map((p) => {
              const emAtraso = p.status === "PREVISTO" && p.data_vencimento < hoje(); // P5: derivado, não armazenado
              const path = { path: { id: p.id } };
              return (
                <Table.Tr key={p.id}>
                  <Table.Td>
                    <Anchor component={Link} to={`/contratos/${p.contrato_id}`}>
                      {String(p.contrato_id).padStart(4, "0")}
                    </Anchor>
                  </Table.Td>
                  <Table.Td>{p.numero_parcela}</Table.Td>
                  <Table.Td>
                    <Data v={p.data_vencimento} />
                  </Table.Td>
                  <Table.Td>
                    <Dinheiro v={p.valor_bruto} />
                  </Table.Td>
                  {verTaxa && (
                    <Table.Td>
                      <Dinheiro v={p.valor_liquido} />
                    </Table.Td>
                  )}
                  <Table.Td>
                    <StatusBadge s={emAtraso ? "ATRASO" : p.status} />
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      {pode.baixaRepasse(papel) && p.status === "PREVISTO" && (
                        <Button
                          size="xs"
                          onClick={() =>
                            agir("Registrar baixa", () =>
                              api.POST("/pagamentos/{id}/baixa", {
                                params: path,
                                body: { data_baixa: hoje() },
                              }),
                            )
                          }
                        >
                          Registrar baixa
                        </Button>
                      )}
                      {pode.baixaRepasse(papel) && p.status === "PAGO" && (
                        <Button
                          size="xs"
                          onClick={() =>
                            agir("Registrar repasse", () =>
                              api.POST("/pagamentos/{id}/repasse", {
                                params: path,
                                body: { data_repasse: hoje() },
                              }),
                            )
                          }
                        >
                          Registrar repasse
                        </Button>
                      )}
                      {pode.estorno(papel) && p.status === "PAGO" && (
                        <Button
                          size="xs"
                          color="red"
                          variant="outline"
                          onClick={() => {
                            const j = window.prompt("Justificativa do estorno:");
                            if (j)
                              agir("Estornar baixa", () =>
                                api.POST("/pagamentos/{id}/estorno", {
                                  params: path,
                                  body: { justificativa: j },
                                }),
                              );
                          }}
                        >
                          Estornar
                        </Button>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <Paginacao page={page} total={data?.total_pages ?? 0} onChange={setPage} />
    </>
  );
}
