import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { api, ok } from "../../shared/api/client";
import { pode } from "../../shared/permissions";
import { Data, Dinheiro, PageHeader, StatusBadge } from "../../shared/ui";
import { Acoes } from "../../shared/ui/acoes";
import { Icone } from "../../shared/ui/icons";
import { Tabela, type Col } from "../../shared/ui/tabela";
import { useSession } from "../auth/session";
import { usePagamentoAcoes } from "../pagamentos/acoes";
import { useContratoAcoes } from "./acoes";
import { taxaTexto } from "./ContratosPage";

export function ContratoDetalhePage() {
  const id = Number(useParams().id),
    { user } = useSession(),
    acoesC = useContratoAcoes(),
    acoesP = usePagamentoAcoes();
  const { data: c } = useQuery({
    queryKey: ["contrato", id],
    queryFn: async () => ok(await api.GET("/contratos/{id}", { params: { path: { id } } })),
  });
  if (!c) return null;
  const papel = user!.papel,
    taxa = pode.verTaxa(papel),
    acoes = acoesC(c),
    p1 = c.pagamentos[0];
  type P = (typeof c.pagamentos)[number];
  const cols: Col<P>[] = [
    { t: "Parcela", r: (p) => `${p.numero_parcela}/${c.num_parcelas}`, o: (p) => p.numero_parcela },
    { t: "Vencimento", r: (p) => <Data v={p.data_vencimento} />, o: (p) => p.data_vencimento },
    { t: "Bruto", r: (p) => <Dinheiro v={p.valor_bruto} c="b" />, o: (p) => p.valor_bruto },
    ...(taxa
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
    { t: "Situação", r: (p) => <StatusBadge s={p.status} />, o: (p) => p.status },
    { t: "Ações", r: (p) => <Acoes acoes={acoesP(p)} /> },
  ];
  return (
    <>
      <p className="sub">
        <Link to="/contratos" style={{ color: "var(--deep)" }}>
          Contratos
        </Link>{" "}
        / {String(c.id).padStart(4, "0")}
      </p>
      <PageHeader
        title={`Contrato ${String(c.id).padStart(4, "0")}`}
        sub={c.descricao}
        actions={<StatusBadge s={c.status} />}
      />
      <div className="card">
        <div className="acts" style={{ alignItems: "center" }}>
          <Acoes acoes={acoes} grande />
          {!acoes.length && (
            <span className="sub">Nenhuma ação disponível para o seu perfil neste estado.</span>
          )}
        </div>
        {c.status === "PENDENTE_APROVACAO" &&
          papel === "ADMINISTRADOR" &&
          c.criado_por_id === user!.usuario_id && (
            <p className="hint">Quem elabora o contrato não pode aprová-lo.</p>
          )}
        {c.motivo_reprovacao && <p className="msg">Reprovado: {c.motivo_reprovacao}</p>}
      </div>
      <div className="two">
        <div className="card">
          <h3>Partes</h3>
          <dl className="kv">
            <dt>Cliente</dt>
            <dd>{c.cliente.nome}</dd>
            <dt>Cooperado</dt>
            <dd>{c.cooperado.nome}</dd>
            <dt>Modalidade</dt>
            <dd>
              {c.modalidade === "MENSAL" ? `Mensal, ${c.num_parcelas} parcelas` : "Pagamento único"}
            </dd>
          </dl>
        </div>
        <div className="card">
          <h3>Valores por parcela</h3>
          <dl className="kv">
            <dt>
              <Icone n="cash" /> {p1 ? "Bruto" : "Total"}
            </dt>
            <dd>
              <Dinheiro v={p1 ? p1.valor_bruto : c.valor_total} c="b" />
            </dd>
            {taxa && (
              <>
                <dt>
                  <Icone n="pct" /> Taxa ({taxaTexto(c)})
                </dt>
                <dd>{p1 ? <Dinheiro v={p1.valor_taxa} c="t" /> : "definida na aprovação"}</dd>
              </>
            )}
            {taxa && p1 && (
              <>
                <dt>
                  <Icone n="wallet" /> Líquido
                </dt>
                <dd>
                  <Dinheiro v={p1.valor_liquido} c="l" />
                </dd>
              </>
            )}
          </dl>
        </div>
      </div>
      <h3>Cronograma de pagamentos</h3>
      {c.pagamentos.length ? (
        <Tabela cols={cols} rows={c.pagamentos} k={(p) => p.id} />
      ) : (
        <div className="card sub">Os pagamentos são gerados quando o contrato é aprovado.</div>
      )}
    </>
  );
}
