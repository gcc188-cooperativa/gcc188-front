import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, ok } from "../../shared/api/client";
import { Data, Dinheiro, Kpi, Nota, PageHeader, Secao, StatusBadge } from "../../shared/ui";
import { Acoes } from "../../shared/ui/acoes";
import { Tabela, type Col } from "../../shared/ui/tabela";
import { useSession } from "../auth/session";
import { usePagamentoAcoes } from "../pagamentos/acoes";
import { situacaoDe } from "../pagamentos/PagamentosPage";

const saudacao = () => {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
};

export function PainelPage() {
  const { user } = useSession(),
    acoes = usePagamentoAcoes();
  const { data: i } = useQuery({
    queryKey: ["indicadores"],
    queryFn: async () => ok(await api.GET("/painel/indicadores")),
  });
  if (!i) return null;
  type P = NonNullable<typeof i.proximos_vencimentos>[number];
  const pend = i.contratos_pendentes_aprovacao ?? 0,
    prox = i.proximos_vencimentos ?? [];
  const cols: Col<P>[] = [
    {
      t: "Contrato",
      r: (p) => (
        <>
          <Link to={`/contratos/${p.contrato_id}`}>{String(p.contrato_id).padStart(4, "0")}</Link> ·
          parcela {p.numero_parcela}
        </>
      ),
      o: (p) => p.contrato_id,
    },
    { t: "Vencimento", r: (p) => <Data v={p.data_vencimento} />, o: (p) => p.data_vencimento },
    {
      t: "Valor",
      r: (p) => <Dinheiro v={p.valor_bruto} c={situacaoDe(p) === "ATRASO" ? "d" : "b"} />,
      o: (p) => p.valor_bruto,
    },
    { t: "Situação", r: (p) => <StatusBadge s={situacaoDe(p)} />, o: (p) => situacaoDe(p) },
    { t: "Ações", r: (p) => <Acoes acoes={acoes(p)} /> },
  ];
  return (
    <>
      <PageHeader
        title={`${saudacao()}, ${user!.nome.split(" ")[0]}`}
        sub="Resumo do que precisa da sua atenção hoje."
      />
      {pend > 0 && (
        <Nota>
          {pend} {pend === 1 ? "contrato aguarda" : "contratos aguardam"} a sua aprovação.{" "}
          <Link to="/contratos">Revisar contratos</Link>
        </Nota>
      )}
      <div className="grid">
        {i.contratos_pendentes_aprovacao !== undefined && (
          <Kpi i="hour" l="Aguardando aprovação" v={pend} />
        )}
        {i.contratos_ativos !== undefined && (
          <Kpi i="play" l="Contratos ativos" v={i.contratos_ativos} />
        )}
        {i.pagamentos_a_receber && (
          <Kpi i="coin" l="A receber" v={<Dinheiro v={i.pagamentos_a_receber.valor} />} />
        )}
        {i.pagamentos_a_repassar && (
          <Kpi i="wallet" l="A repassar" v={<Dinheiro v={i.pagamentos_a_repassar.valor} />} c="l" />
        )}
        {i.pagamentos_em_atraso && (
          <Kpi i="alert" l="Em atraso" v={i.pagamentos_em_atraso.quantidade} c="d" />
        )}
      </div>
      <Secao
        t="Próximos vencimentos"
        aside={<Link to="/pagamentos">Ver todos os pagamentos</Link>}
      />
      {prox.length ? (
        <Tabela cols={cols} rows={prox} k={(p) => p.id} />
      ) : (
        <div className="card sub">Nenhum vencimento próximo.</div>
      )}
    </>
  );
}
