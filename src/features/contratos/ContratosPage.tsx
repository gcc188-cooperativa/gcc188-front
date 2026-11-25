import { Button, NativeSelect } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { api, ok } from "../../shared/api/client";
import { useNomes } from "../../shared/api/opcoes";
import { pode } from "../../shared/permissions";
import { Dinheiro, PageHeader, Paginacao, StatusBadge, reais } from "../../shared/ui";
import { Acoes } from "../../shared/ui/acoes";
import { Icone } from "../../shared/ui/icons";
import { Tabela, type Col } from "../../shared/ui/tabela";
import { useSession } from "../auth/session";
import { useContratoAcoes } from "./acoes";

type C = {
  id: number;
  cliente_id: number;
  cooperado_id: number;
  valor_total: number;
  taxa_tipo: string;
  taxa_valor: number;
  status: "RASCUNHO";
  criado_por_id: number;
};
export const taxaTexto = (c: Pick<C, "taxa_tipo" | "taxa_valor">) =>
  c.taxa_tipo === "PERCENTUAL" ? `${c.taxa_valor}%` : `${reais(c.taxa_valor)} fixo`;

export function ContratosPage() {
  const papel = useSession().user!.papel,
    nomes = useNomes(),
    acoes = useContratoAcoes();
  const [page, setPage] = useState(0),
    [status, setStatus] = useState("");
  const { data } = useQuery({
    queryKey: ["contratos", page, status],
    queryFn: async () =>
      ok(
        await api.GET("/contratos", {
          params: { query: { page, size: 20, ...(status ? { status: status as "ATIVO" } : {}) } },
        }),
      ),
  });
  const cols: Col<C>[] = [
    {
      t: "Contrato",
      r: (c) => <Link to={`/contratos/${c.id}`}>{String(c.id).padStart(4, "0")}</Link>,
      o: (c) => c.id,
    },
    { t: "Cliente", r: (c) => nomes.cliente(c.cliente_id), o: (c) => nomes.cliente(c.cliente_id) },
    {
      t: "Cooperado",
      r: (c) => nomes.cooperado(c.cooperado_id),
      o: (c) => nomes.cooperado(c.cooperado_id),
    },
    { t: "Valor total", r: (c) => <Dinheiro v={c.valor_total} c="b" />, o: (c) => c.valor_total },
    ...(pode.verTaxa(papel)
      ? [{ t: "Taxa", r: (c: C) => taxaTexto(c), o: (c: C) => c.taxa_valor }]
      : []),
    { t: "Situação", r: (c) => <StatusBadge s={c.status} />, o: (c) => c.status },
    { t: "Ações", r: (c) => <Acoes acoes={acoes(c)} /> },
  ];
  return (
    <>
      <PageHeader
        title="Contratos"
        sub={
          papel === "CLIENTE"
            ? "Seus contratos com a cooperativa."
            : "Acompanhe o ciclo de cada contrato."
        }
        actions={
          (papel === "MOTORISTA" || papel === "ADMINISTRADOR") && (
            <Button component={Link} variant="default" className="bt pri" to="/contratos/novo">
              <Icone n="plus" />
              Novo contrato
            </Button>
          )
        }
      />
      <div className="fl">
        <NativeSelect
          aria-label="Situação"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
        >
          <option value="">Situação: todas</option>
          <option value="RASCUNHO">Rascunho</option>
          <option value="PENDENTE_APROVACAO">Pendente</option>
          <option value="ATIVO">Ativo</option>
          <option value="ENCERRADO">Encerrado</option>
          <option value="CANCELADO">Cancelado</option>
        </NativeSelect>
      </div>
      <Tabela cols={cols} rows={(data?.content ?? []) as unknown as C[]} k={(c) => c.id} />
      {data?.content.length === 0 && <p className="sub">Nenhum contrato encontrado.</p>}
      <Paginacao page={page} total={data?.total_pages ?? 0} onChange={setPage} />
    </>
  );
}
