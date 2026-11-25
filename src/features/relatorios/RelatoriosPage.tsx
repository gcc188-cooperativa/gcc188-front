import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useState } from "react";
import { api, ok, type Schemas } from "../../shared/api/client";
import { useCooperados } from "../../shared/api/opcoes";
import { CATEGORIA, Data, Dinheiro, Kpi, Nota, PageHeader, StatusBadge } from "../../shared/ui";
import { COR, Donut } from "../../shared/ui/charts";
import { numeroOuNulo } from "../../shared/ui/numero";
import { Tabela } from "../../shared/ui/tabela";
import { useSession } from "../auth/session";

type Per = { data_inicio: string; data_fim: string };
const F = "YYYY-MM-DD",
  OP = [1, 0.6, 0.3, 0.15];
const intervalo = (p: string): Per => {
  const h = dayjs();
  return p === "ano"
    ? { data_inicio: h.startOf("year").format(F), data_fim: h.endOf("year").format(F) }
    : p === "3m"
      ? {
          data_inicio: h.subtract(2, "month").startOf("month").format(F),
          data_fim: h.endOf("month").format(F),
        }
      : { data_inicio: h.startOf("month").format(F), data_fim: h.endOf("month").format(F) };
};

function GraficosResumo({
  r,
  d,
}: {
  r: Schemas["ResumoFinanceiro"];
  d?: Schemas["DespesaTotais"];
}) {
  const liquido = r.a_repassar + r.repassado,
    pct = Math.round((r.taxas_arrecadadas / (r.taxas_arrecadadas + liquido || 1)) * 100);
  return (
    <div className="two">
      <Donut
        titulo="Divisão do valor recebido"
        centro={`${pct}%`}
        sub="é taxa"
        fatias={[
          { nome: "Líquido (cooperados)", valor: liquido, cor: COR.l },
          { nome: "Taxa da cooperativa", valor: r.taxas_arrecadadas, cor: COR.t },
        ]}
      />
      {d && d.por_categoria.length > 0 && (
        <Donut
          titulo="Despesas da cooperativa por categoria"
          centro={String(d.por_categoria.length)}
          sub="categorias"
          fatias={d.por_categoria.map((c, k) => ({
            nome: CATEGORIA[c.categoria],
            valor: c.total,
            cor: COR.d,
            op: OP[k % 4],
          }))}
        />
      )}
    </div>
  );
}

function Resumo({ q }: { q: Per }) {
  const { data: r } = useQuery({
    queryKey: ["rel-resumo", q],
    queryFn: async () =>
      ok(await api.GET("/relatorios/resumo-financeiro", { params: { query: q } })),
  });
  const { data: d } = useQuery({
    queryKey: ["despesas-totais", "COOPERATIVA", q],
    queryFn: async () =>
      ok(
        await api.GET("/despesas/totais", {
          params: {
            query: { origem: "COOPERATIVA", data_de: q.data_inicio, data_ate: q.data_fim },
          },
        }),
      ),
  });
  if (!r) return null;
  return (
    <>
      <div className="grid">
        <Kpi i="pct" l="Taxas arrecadadas" v={<Dinheiro v={r.taxas_arrecadadas} />} c="t" />
        <Kpi i="wallet" l="A repassar" v={<Dinheiro v={r.a_repassar} />} c="l" />
        <Kpi i="check2" l="Repassado" v={<Dinheiro v={r.repassado} />} c="l" />
        <Kpi
          i="down"
          l="Despesas da cooperativa"
          v={<Dinheiro v={r.despesas_cooperativa} />}
          c="d"
        />
      </div>
      <GraficosResumo r={r} d={d} />
      <div className="card">
        <div className="vl">Saldo do período (taxas − despesas)</div>
        <div className="val b">
          <Dinheiro v={r.saldo} c="b" />
        </div>
      </div>
    </>
  );
}

function FiltroExtrato({
  mot,
  nome,
  opcoes,
  sel,
  setSel,
}: {
  mot: boolean;
  nome: string;
  opcoes: { value: string; label: string }[];
  sel: string;
  setSel: (v: string) => void;
}) {
  return mot ? (
    <Nota>Extrato de {nome}.</Nota>
  ) : (
    <div className="fd" style={{ maxWidth: 320 }}>
      <label htmlFor="cs">Cooperado</label>
      <select id="cs" value={sel} onChange={(x) => setSel(x.target.value)}>
        <option value="">Selecione</option>
        {opcoes.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function KpisExtrato({ e }: { e: Schemas["Extrato"] }) {
  return (
    <div className="grid">
      <Kpi i="cash" l="Bruto recebido" v={<Dinheiro v={e.total_bruto} />} />
      <Kpi i="pct" l="Taxa" v={<Dinheiro v={e.total_taxa} />} c="t" />
      <Kpi i="wallet" l="Líquido" v={<Dinheiro v={e.total_liquido} />} c="l" />
      <Kpi i="down" l="Despesas" v={<Dinheiro v={e.total_despesas} />} c="d" />
    </div>
  );
}

function GraficosExtrato({ e }: { e: Schemas["Extrato"] }) {
  const cat: Record<string, number> = {};
  e.despesas.forEach((d) => {
    cat[d.categoria] = (cat[d.categoria] ?? 0) + d.valor;
  });
  return (
    <div className="two">
      <Donut
        titulo="Divisão do bruto recebido"
        centro={`${e.total_bruto ? Math.round((e.total_taxa / e.total_bruto) * 100) : 0}%`}
        sub="é taxa"
        fatias={[
          { nome: "Líquido", valor: e.total_liquido, cor: COR.l },
          { nome: "Taxa", valor: e.total_taxa, cor: COR.t },
        ]}
      />
      {Object.keys(cat).length > 0 && (
        <Donut
          titulo="Despesas por categoria"
          centro={String(e.total_despesas)}
          sub="despesas"
          fatias={Object.entries(cat).map(([k, v], i) => ({
            nome: CATEGORIA[k],
            valor: v,
            cor: COR.d,
            op: OP[i % 4],
          }))}
        />
      )}
    </div>
  );
}

type LinhaExtrato = {
  k: string;
  data: string;
  item: string;
  valor: number;
  cor: string;
  st: string | null;
};

function TabelaExtrato({ linhas }: { linhas: LinhaExtrato[] }) {
  return (
    <Tabela
      rows={linhas}
      k={(l) => l.k}
      cols={[
        { t: "Data", r: (l) => <Data v={l.data} />, o: (l) => l.data },
        { t: "Item", r: (l) => l.item, o: (l) => l.item },
        { t: "Valor", r: (l) => <Dinheiro v={l.valor} c={l.cor} />, o: (l) => l.valor },
        { t: "Situação", r: (l) => (l.st ? <StatusBadge s={l.st} /> : "—") },
      ]}
    />
  );
}

function Extrato({ q }: { q: Per }) {
  const { user } = useSession(),
    mot = user!.papel === "MOTORISTA",
    coops = useCooperados(!mot),
    [sel, setSel] = useState("");
  const id = mot ? user!.vinculo_id : numeroOuNulo(sel);
  const { data: e } = useQuery({
    queryKey: ["rel-extrato", id, q],
    enabled: !!id,
    queryFn: async () =>
      ok(await api.GET("/cooperados/{id}/extrato", { params: { path: { id: id! }, query: q } })),
  });
  const linhas: LinhaExtrato[] = e
    ? [
        ...e.pagamentos.map((p) => ({
          k: `p${p.pagamento_id}`,
          data: p.data_vencimento,
          item: `Contrato ${String(p.contrato_id).padStart(4, "0")} · parcela ${p.numero_parcela}`,
          valor: p.valor_liquido,
          cor: "l",
          st: p.status as string | null,
        })),
        ...e.despesas.map((d) => ({
          k: `d${d.id}`,
          data: d.data_despesa,
          item: `${CATEGORIA[d.categoria]} · ${d.descricao}`,
          valor: d.valor,
          cor: "d",
          st: null,
        })),
      ]
    : [];
  return (
    <>
      <FiltroExtrato
        mot={mot}
        nome={user!.nome}
        opcoes={coops.data ?? []}
        sel={sel}
        setSel={setSel}
      />
      {e && (
        <>
          <KpisExtrato e={e} />
          <GraficosExtrato e={e} />
          <TabelaExtrato linhas={linhas} />
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
  if (!r.por_cliente.length) return <div className="card sub">Nenhum pagamento em atraso.</div>;
  return (
    <>
      <Donut
        titulo="Valor em atraso por cliente"
        centro={String(r.por_cliente.reduce((s, c) => s + c.quantidade, 0))}
        sub="títulos"
        fatias={r.por_cliente.map((c, i) => ({
          nome: c.cliente.nome,
          valor: c.valor_total,
          cor: COR.d,
          op: OP[i % 4],
        }))}
      />
      <Tabela
        rows={r.por_cliente}
        k={(c) => c.cliente.id}
        cols={[
          { t: "Cliente", r: (c) => c.cliente.nome, o: (c) => c.cliente.nome },
          { t: "Parcelas em atraso", r: (c) => c.quantidade, o: (c) => c.quantidade },
          { t: "Valor", r: (c) => <Dinheiro v={c.valor_total} c="d" />, o: (c) => c.valor_total },
        ]}
      />
    </>
  );
}

export function RelatoriosPage() {
  const mot = useSession().user!.papel === "MOTORISTA",
    [per, setPer] = useState("mes"),
    [aba, setAba] = useState(mot ? "extrato" : "resumo");
  const abas = mot
    ? [["extrato", "Meu extrato"]]
    : [
        ["resumo", "Resumo financeiro"],
        ["extrato", "Extrato do cooperado"],
        ["atraso", "Inadimplência"],
      ];
  const q = intervalo(per);
  return (
    <>
      <PageHeader
        title="Relatórios"
        sub="Escolha o período e o tipo de relatório."
        actions={
          <select aria-label="Período" value={per} onChange={(e) => setPer(e.target.value)}>
            <option value="mes">Este mês</option>
            <option value="3m">Últimos 3 meses</option>
            <option value="ano">Este ano</option>
          </select>
        }
      />
      <div className="tabs" role="tablist" aria-label="Tipos de relatório">
        {abas.map(([k, n]) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`tab-${k}`}
            aria-selected={k === aba}
            aria-controls="tp"
            className={k === aba ? "on" : ""}
            onClick={() => setAba(k)}
          >
            {n}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="tp" aria-labelledby={`tab-${aba}`}>
        {aba === "resumo" ? (
          <Resumo q={q} />
        ) : aba === "extrato" ? (
          <Extrato q={q} />
        ) : (
          <Inadimplencia />
        )}
      </div>
    </>
  );
}
