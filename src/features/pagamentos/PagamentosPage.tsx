import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api, ok, type Schemas } from "../../shared/api/client";
import { pode, type Papel } from "../../shared/permissions";
import { Data, Dinheiro, PageHeader, Paginacao, StatusBadge } from "../../shared/ui";
import { COR, Donut } from "../../shared/ui/charts";
import type { Acao } from "../../shared/ui/acoes";
import { Tabela, type Col } from "../../shared/ui/tabela";
import { useSession } from "../auth/session";
import { usePagamentoAcoes } from "./acoes";

type P = {
  id: number;
  contrato_id: number;
  numero_parcela: number;
  data_vencimento: string;
  valor_bruto: number;
  valor_taxa: number;
  valor_liquido: number;
  status: string;
};
type Acoes = ReturnType<typeof usePagamentoAcoes>;

export const situacaoDe = (p: P) =>
  p.status === "PREVISTO" && p.data_vencimento < dayjs().format("YYYY-MM-DD") ? "ATRASO" : p.status;

function usePagamentosDados() {
  const papel = useSession().user!.papel;
  const [page, setPage] = useState(0);
  const [sit, setSit] = useState("");
  const q = {
    page,
    size: 20,
    sort: "data_vencimento,asc",
    ...(sit === "ATRASO" ? { em_atraso: true } : sit ? { status: sit as "PAGO" } : {}),
  };
  const { data } = useQuery({
    queryKey: ["pagamentos", page, sit],
    queryFn: async () => ok(await api.GET("/pagamentos", { params: { query: q } })),
  });
  const financeiro = papel === "ADMINISTRADOR" || papel === "FINANCEIRO";
  const mes = {
    data_inicio: dayjs().startOf("month").format("YYYY-MM-DD"),
    data_fim: dayjs().endOf("month").format("YYYY-MM-DD"),
  };
  const { data: res } = useQuery({
    queryKey: ["rel-resumo", mes],
    enabled: financeiro,
    queryFn: async () =>
      ok(await api.GET("/relatorios/resumo-financeiro", { params: { query: mes } })),
  });
  return { papel, page, setPage, sit, setSit, data, res };
}

function BotoesPagamento({ acoes }: { acoes: Acao[] }) {
  return (
    <div className="acts">
      {acoes.map((a) => (
        <button
          key={a.rotulo}
          type="button"
          className={`bt ${a.perigo ? "danger" : "pri"}`}
          onClick={a.fazer}
        >
          {a.rotulo}
        </button>
      ))}
    </div>
  );
}

function useColunasPagamentos({ papel, acoes }: { papel: Papel; acoes: Acoes }) {
  const verTaxa = pode.verTaxa(papel);
  const cols: Col<P>[] = [
    {
      t: "Contrato",
      r: (p) => (
        <Link to={`/contratos/${p.contrato_id}`}>{String(p.contrato_id).padStart(4, "0")}</Link>
      ),
      o: (p) => p.contrato_id,
    },
    { t: "Parcela", r: (p) => p.numero_parcela, o: (p) => p.numero_parcela },
    { t: "Vencimento", r: (p) => <Data v={p.data_vencimento} />, o: (p) => p.data_vencimento },
    { t: "Bruto", r: (p) => <Dinheiro v={p.valor_bruto} c="b" />, o: (p) => p.valor_bruto },
    ...(verTaxa
      ? [
          {
            t: "Taxa",
            r: (p: P) => <Dinheiro v={p.valor_taxa} c="t" />,
            o: (p: P) => p.valor_taxa,
          },
          {
            t: "Líquido",
            r: (p: P) => <Dinheiro v={p.valor_liquido} c="l" />,
            o: (p: P) => p.valor_liquido,
          },
        ]
      : []),
    { t: "Situação", r: (p) => <StatusBadge s={situacaoDe(p)} />, o: (p) => situacaoDe(p) },
    { t: "Ações", r: (p) => <BotoesPagamento acoes={acoes(p)} /> },
  ];
  return cols;
}

function percentualTaxa(res: Schemas["ResumoFinanceiro"]) {
  const total = res.taxas_arrecadadas + res.a_repassar + res.repassado || 1;
  return `${Math.round((res.taxas_arrecadadas / total) * 100)}%`;
}

function GraficoPagamentos({ res }: { res: Schemas["ResumoFinanceiro"] }) {
  return (
    <div className="two">
      <Donut
        titulo="Divisão do valor recebido"
        fatias={[
          { nome: "Líquido", valor: res.a_repassar + res.repassado, cor: COR.l },
          { nome: "Taxa", valor: res.taxas_arrecadadas, cor: COR.t },
        ]}
        centro={percentualTaxa(res)}
        sub="é taxa"
      />
    </div>
  );
}

function FiltroSituacao({ sit, trocar }: { sit: string; trocar: (v: string) => void }) {
  return (
    <div className="fl">
      <select aria-label="Situação" value={sit} onChange={(e) => trocar(e.target.value)}>
        <option value="">Situação: todas</option>
        <option value="PREVISTO">Previsto</option>
        <option value="PAGO">Pago</option>
        <option value="REPASSADO">Repassado</option>
        <option value="ATRASO">Em atraso</option>
      </select>
    </div>
  );
}

export function PagamentosPage() {
  const { papel, page, setPage, sit, setSit, data, res } = usePagamentosDados();
  const acoes = usePagamentoAcoes();
  const cols = useColunasPagamentos({ papel, acoes });
  return (
    <>
      <PageHeader
        title="Pagamentos"
        sub={
          pode.baixaRepasse(papel)
            ? "Registre baixas e repasses. Ordene pela coluna Situação para ver os atrasos."
            : "Parcelas dos contratos."
        }
      />
      <FiltroSituacao
        sit={sit}
        trocar={(v) => {
          setSit(v);
          setPage(0);
        }}
      />
      {res && <GraficoPagamentos res={res} />}
      <Tabela cols={cols} rows={data?.content ?? []} k={(p) => p.id} />
      {data?.content.length === 0 && <p className="sub">Nenhum pagamento no filtro atual.</p>}
      <Paginacao page={page} total={data?.total_pages ?? 0} onChange={setPage} />
    </>
  );
}
