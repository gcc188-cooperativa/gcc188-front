import { Button, NativeSelect, TextInput } from "@mantine/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, msgErro, ok } from "../../shared/api/client";
import { useCooperados } from "../../shared/api/opcoes";
import { CATEGORIA, Data, Dinheiro, PageHeader, Paginacao } from "../../shared/ui";
import { Acoes } from "../../shared/ui/acoes";
import { COR, Donut } from "../../shared/ui/charts";
import { confirmar } from "../../shared/ui/confirm";
import { Icone } from "../../shared/ui/icons";
import { Tabela, type Col } from "../../shared/ui/tabela";
import { toast } from "../../shared/ui/toast";
import { useSession } from "../auth/session";

export const CATEGORIAS = Object.keys(CATEGORIA);
const OPACIDADE = [1, 0.6, 0.3, 0.15];

export function DespesasPage() {
  const papel = useSession().user!.papel,
    mot = papel === "MOTORISTA",
    qc = useQueryClient(),
    nav = useNavigate();
  const coops = useCooperados(!mot);
  const [page, setPage] = useState(0),
    [origem, setOrigem] = useState(""),
    [cat, setCat] = useState(""),
    [busca, setBusca] = useState("");
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
  type D = NonNullable<typeof data>["content"][number];
  const excluir = (id: number) =>
    confirmar({
      titulo: "Excluir despesa?",
      perigo: true,
      aoConfirmar: async () => {
        const r = await api.DELETE("/despesas/{id}", { params: { path: { id } } });
        if (r.error) return toast(msgErro(r.error), true);
        ["despesas", "despesas-totais"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      },
    });
  const nomeCoop = (id?: number | null) =>
    coops.data?.find((o) => o.value === String(id))?.label.replace(/^.*? · /, "");
  const linhas = (data?.content ?? []).filter((d) =>
    d.descricao.toLowerCase().includes(busca.toLowerCase()),
  );
  const cols: Col<D>[] = [
    { t: "Data", r: (d) => <Data v={d.data_despesa} />, o: (d) => d.data_despesa },
    {
      t: "Origem",
      r: (d) =>
        (d.origem === "COOPERATIVA" ? "Cooperativa" : "Cooperado") +
        (!mot && nomeCoop(d.cooperado_id) ? ` · ${nomeCoop(d.cooperado_id)}` : ""),
      o: (d) => d.origem,
    },
    { t: "Categoria", r: (d) => CATEGORIA[d.categoria], o: (d) => d.categoria },
    { t: "Descrição", r: (d) => d.descricao, o: (d) => d.descricao },
    { t: "Valor", r: (d) => <Dinheiro v={d.valor} c="d" />, o: (d) => d.valor },
    {
      t: "Ações",
      r: (d) => (
        <Acoes
          acoes={[
            { rotulo: "Editar", fazer: () => nav(`/despesas/${d.id}/editar`) },
            { rotulo: "Excluir despesa", perigo: true, fazer: () => excluir(d.id) },
          ]}
        />
      ),
    },
  ];
  return (
    <>
      <PageHeader
        title="Despesas"
        sub={
          mot
            ? "Suas despesas. Elas não reduzem o valor do repasse."
            : "Despesas da cooperativa e dos cooperados."
        }
        actions={
          <Button component={Link} variant="default" className="bt pri" to="/despesas/nova">
            <Icone n="plus" />
            Nova despesa
          </Button>
        }
      />
      <div className="fl">
        <TextInput
          placeholder="Buscar na descrição"
          aria-label="Buscar na descrição"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <NativeSelect
          aria-label="Origem"
          value={origem}
          onChange={(e) => {
            setOrigem(e.target.value);
            setPage(0);
          }}
        >
          <option value="">Origem: todas</option>
          <option value="COOPERATIVA">Cooperativa</option>
          <option value="COOPERADO">Cooperado</option>
        </NativeSelect>
        <NativeSelect
          aria-label="Categoria"
          value={cat}
          onChange={(e) => {
            setCat(e.target.value);
            setPage(0);
          }}
        >
          <option value="">Categoria: todas</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {CATEGORIA[c]}
            </option>
          ))}
        </NativeSelect>
      </div>
      {tot && tot.por_categoria.length > 0 && (
        <div className="two">
          <Donut
            titulo="Despesas por categoria"
            centro={String(tot.por_categoria.length)}
            sub="categorias"
            fatias={tot.por_categoria.map((c, k) => ({
              nome: CATEGORIA[c.categoria],
              valor: c.total,
              cor: COR.d,
              op: OPACIDADE[k % 4],
            }))}
          />
        </div>
      )}
      <Tabela cols={cols} rows={linhas} k={(d) => d.id} />
      {linhas.length === 0 && <p className="sub">Nenhuma despesa no filtro atual.</p>}
      {tot && (
        <div className="card sub">
          Total no período: <Dinheiro v={tot.total_geral} c="d" />
        </div>
      )}
      <Paginacao page={page} total={data?.total_pages ?? 0} onChange={setPage} />
    </>
  );
}
