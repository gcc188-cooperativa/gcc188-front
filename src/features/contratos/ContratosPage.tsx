import { Anchor, Button, Select, Table } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api, ok } from "../../shared/api/client";
import { useSession } from "../auth/session";
import { Dinheiro, PageHeader, Paginacao, StatusBadge } from "../../shared/ui";

export function ContratosPage() {
  const papel = useSession().user!.papel;
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["contratos", page, status],
    queryFn: async () =>
      ok(
        await api.GET("/contratos", {
          params: { query: { page, size: 20, ...(status ? { status: status as never } : {}) } },
        }),
      ),
  });
  return (
    <>
      <PageHeader
        title="Contratos"
        sub="Acompanhe o ciclo de cada contrato."
        actions={
          (papel === "MOTORISTA" || papel === "ADMINISTRADOR") && (
            <Button component={Link} to="/contratos/novo">
              Novo contrato
            </Button>
          )
        }
      />
      <Select
        mb="md"
        placeholder="Situação: todas"
        clearable
        data={["RASCUNHO", "PENDENTE_APROVACAO", "ATIVO", "ENCERRADO", "CANCELADO"]}
        value={status}
        onChange={(v) => {
          setStatus(v);
          setPage(0);
        }}
      />
      <Table.ScrollContainer minWidth={600}>
        <Table highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Contrato</Table.Th>
              <Table.Th>Descrição</Table.Th>
              <Table.Th>Valor total</Table.Th>
              <Table.Th>Situação</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.content.map((c) => (
              <Table.Tr key={c.id}>
                <Table.Td>
                  <Anchor component={Link} to={`/contratos/${c.id}`}>
                    {String(c.id).padStart(4, "0")}
                  </Anchor>
                </Table.Td>
                <Table.Td>{c.descricao}</Table.Td>
                <Table.Td>
                  <Dinheiro v={c.valor_total} />
                </Table.Td>
                <Table.Td>
                  <StatusBadge s={c.status} />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      {data?.content.length === 0 && <p>Nenhum contrato encontrado.</p>}
      <Paginacao page={page} total={data?.total_pages ?? 0} onChange={setPage} />
    </>
  );
}
