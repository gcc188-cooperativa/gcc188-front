import { CORES, Donut } from "../../shared/ui/charts";
import { Anchor, Button, Group, Select, Table, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, msgErro, ok } from "../../shared/api/client";
import { Data, Dinheiro, PageHeader, Paginacao } from "../../shared/ui";

export const CATEGORIAS = [
  "COMBUSTIVEL",
  "PEDAGIO",
  "MANUTENCAO",
  "ADMINISTRATIVA",
  "TRIBUTOS",
  "OUTROS",
];

export function DespesasPage() {
  const [page, setPage] = useState(0);
  const [origem, setOrigem] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const qc = useQueryClient();
  const nav = useNavigate();
  const f = {
    ...(origem ? { origem: origem as "COOPERADO" } : {}),
    ...(cat ? { categoria: cat as "OUTROS" } : {}),
  };
  const { data } = useQuery({
    queryKey: ["despesas", page, origem, cat],
    queryFn: async () =>
      ok(await api.GET("/despesas", { params: { query: { page, size: 20, ...f } } })),
  });
  const { data: tot } = useQuery({
    queryKey: ["despesas-totais", origem, cat],
    queryFn: async () => ok(await api.GET("/despesas/totais", { params: { query: f } })),
  });
  const excluir = (id: number) =>
    modals.openConfirmModal({
      title: "Excluir despesa?",
      labels: { confirm: "Excluir", cancel: "Voltar" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        const r = await api.DELETE("/despesas/{id}", { params: { path: { id } } });
        if (r.error) notifications.show({ color: "red", message: msgErro(r.error) });
        else {
          qc.invalidateQueries({ queryKey: ["despesas"] });
          qc.invalidateQueries({ queryKey: ["despesas-totais"] });
        }
      },
    });
  return (
    <>
      <PageHeader
        title="Despesas"
        sub="Despesas da cooperativa e dos cooperados. Não reduzem o repasse."
        actions={
          <Button component={Link} to="/despesas/nova">
            Nova despesa
          </Button>
        }
      />
      <Group mb="md">
        <Select
          placeholder="Origem: todas"
          clearable
          data={["COOPERATIVA", "COOPERADO"]}
          value={origem}
          onChange={(v) => {
            setOrigem(v);
            setPage(0);
          }}
        />
        <Select
          placeholder="Categoria: todas"
          clearable
          data={CATEGORIAS}
          value={cat}
          onChange={(v) => {
            setCat(v);
            setPage(0);
          }}
        />
      </Group>
      <Table.ScrollContainer minWidth={650}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Data</Table.Th>
              <Table.Th>Origem</Table.Th>
              <Table.Th>Categoria</Table.Th>
              <Table.Th>Descrição</Table.Th>
              <Table.Th>Valor</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.content.map((d) => (
              <Table.Tr key={d.id}>
                <Table.Td>
                  <Data v={d.data_despesa} />
                </Table.Td>
                <Table.Td>{d.origem}</Table.Td>
                <Table.Td>{d.categoria}</Table.Td>
                <Table.Td>{d.descricao}</Table.Td>
                <Table.Td>
                  <Dinheiro v={d.valor} />
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Anchor size="sm" onClick={() => nav(`/despesas/${d.id}/editar`)}>
                      Editar
                    </Anchor>
                    <Anchor size="sm" c="red" onClick={() => excluir(d.id)}>
                      Excluir
                    </Anchor>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      {data?.content.length === 0 && <p>Nenhuma despesa no filtro atual.</p>}
      {tot && (
        <Text mt="md" fw={600}>
          Total no filtro: <Dinheiro v={tot.total_geral} />
        </Text>
      )}
      {tot && tot.por_categoria.length > 0 && (
        <Donut
          titulo="Despesas por categoria"
          fatias={tot.por_categoria.map((c, k) => ({
            nome: c.categoria,
            valor: c.total,
            cor: CORES[k % CORES.length],
          }))}
        />
      )}
      <Paginacao page={page} total={data?.total_pages ?? 0} onChange={setPage} />
    </>
  );
}
