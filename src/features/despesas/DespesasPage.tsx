import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, msgErro, ok, type Schemas } from "../../shared/api/client";
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

type D = Schemas["Despesa"];
type Tot = Schemas["DespesaTotais"];
type Filtros = { page: number; origem: string; cat: string; busca: string };
type Trocar = (p: Partial<Filtros>) => void;

function useDespesasDados(f: Filtros) {
  const filtro = {
    ...(f.origem ? { origem: f.origem as "COOPERADO" } : {}),
    ...(f.cat ? { categoria: f.cat as "OUTROS" } : {}),
  };
  const { data } = useQuery({
    queryKey: ["despesas", f.page, f.origem, f.cat],
    queryFn: async () =>
      ok(await api.GET("/despesas", { params: { query: { page: f.page, size: 20, ...filtro } } })),
  });
  const { data: tot } = useQuery({
    queryKey: ["despesas-totais", f.origem, f.cat],
    queryFn: async () => ok(await api.GET("/despesas/totais", { params: { query: filtro } })),
  });
  return { data, tot };
}

function useExcluirDespesa() {
  const qc = useQueryClient();
  return (id: number) =>
    confirmar({
      titulo: "Excluir despesa?",
      perigo: true,
      aoConfirmar: async () => {
        const r = await api.DELETE("/despesas/{id}", { params: { path: { id } } });
        if (r.error) return toast(msgErro(r.error), true);
        ["despesas", "despesas-totais"].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      },
    });
}

function rotuloOrigem(d: D, mot: boolean, nomeCoop: (id?: number | null) => string | undefined) {
  const nome = mot ? undefined : nomeCoop(d.cooperado_id);
  return (d.origem === "COOPERATIVA" ? "Cooperativa" : "Cooperado") + (nome ? ` · ${nome}` : "");
}

function useColunasDespesas({
  mot,
  f,
  data,
}: {
  mot: boolean;
  f: Filtros;
  data: Schemas["DespesaPagina"] | undefined;
}) {
  const nav = useNavigate();
  const coops = useCooperados(!mot);
  const excluir = useExcluirDespesa();
  const nomeCoop = (id?: number | null) =>
    coops.data?.find((o) => o.value === String(id))?.label.replace(/^.*? · /, "");
  const linhas = (data?.content ?? []).filter((d) =>
    d.descricao.toLowerCase().includes(f.busca.toLowerCase()),
  );
  const cols: Col<D>[] = [
    { t: "Data", r: (d) => <Data v={d.data_despesa} />, o: (d) => d.data_despesa },
    { t: "Origem", r: (d) => rotuloOrigem(d, mot, nomeCoop), o: (d) => d.origem },
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
  return { linhas, cols };
}

function CabecalhoDespesas({ mot }: { mot: boolean }) {
  return (
    <PageHeader
      title="Despesas"
      sub={
        mot
          ? "Suas despesas. Elas não reduzem o valor do repasse."
          : "Despesas da cooperativa e dos cooperados."
      }
      actions={
        <Link className="bt pri" to="/despesas/nova">
          <Icone n="plus" />
          Nova despesa
        </Link>
      }
    />
  );
}

function FiltrosDespesas({ f, trocar }: { f: Filtros; trocar: Trocar }) {
  return (
    <div className="fl">
      <input
        placeholder="Buscar na descrição"
        aria-label="Buscar na descrição"
        value={f.busca}
        onChange={(e) => trocar({ busca: e.target.value })}
      />
      <select
        aria-label="Origem"
        value={f.origem}
        onChange={(e) => trocar({ origem: e.target.value })}
      >
        <option value="">Origem: todas</option>
        <option value="COOPERATIVA">Cooperativa</option>
        <option value="COOPERADO">Cooperado</option>
      </select>
      <select
        aria-label="Categoria"
        value={f.cat}
        onChange={(e) => trocar({ cat: e.target.value })}
      >
        <option value="">Categoria: todas</option>
        {CATEGORIAS.map((c) => (
          <option key={c} value={c}>
            {CATEGORIA[c]}
          </option>
        ))}
      </select>
    </div>
  );
}

function GraficoDespesas({ tot }: { tot: Tot | undefined }) {
  return (
    tot &&
    tot.por_categoria.length > 0 && (
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
    )
  );
}

export function DespesasPage() {
  const papel = useSession().user!.papel;
  const mot = papel === "MOTORISTA";
  const [f, setF] = useState<Filtros>({ page: 0, origem: "", cat: "", busca: "" });
  const { data, tot } = useDespesasDados(f);
  const { linhas, cols } = useColunasDespesas({ mot, f, data });
  const trocar: Trocar = (p) =>
    setF((antes) => ({
      ...antes,
      ...p,
      ...(p.origem !== undefined || p.cat !== undefined ? { page: 0 } : {}),
    }));
  return (
    <>
      <CabecalhoDespesas mot={mot} />
      <FiltrosDespesas f={f} trocar={trocar} />
      <GraficoDespesas tot={tot} />
      <Tabela cols={cols} rows={linhas} k={(d) => d.id} />
      {linhas.length === 0 && <p className="sub">Nenhuma despesa no filtro atual.</p>}
      {tot && (
        <div className="card sub">
          Total no período: <Dinheiro v={tot.total_geral} c="d" />
        </div>
      )}
      <Paginacao
        page={f.page}
        total={data?.total_pages ?? 0}
        onChange={(page) => trocar({ page })}
      />
    </>
  );
}
