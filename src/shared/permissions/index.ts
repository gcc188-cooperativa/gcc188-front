import type { Schemas } from "../api/client";
export type Papel = Schemas["Papel"];
export type Status = Schemas["ContratoStatus"];
export type AcaoContrato =
  "editar" | "submeter" | "excluir" | "aprovar" | "reprovar" | "encerrar" | "cancelar";

const ACOES_POR_STATUS: Record<Status, AcaoContrato[]> = {
  RASCUNHO: ["editar", "submeter", "excluir", "cancelar"],
  PENDENTE_APROVACAO: ["aprovar", "reprovar", "cancelar"],
  ATIVO: ["encerrar", "cancelar"],
  ENCERRADO: [],
  CANCELADO: [],
};
const PERMISSOES: Record<AcaoContrato, Papel[]> = {
  editar: ["MOTORISTA", "ADMINISTRADOR"],
  submeter: ["MOTORISTA", "ADMINISTRADOR"],
  excluir: ["MOTORISTA", "ADMINISTRADOR"],
  aprovar: ["ADMINISTRADOR"],
  reprovar: ["ADMINISTRADOR"],
  encerrar: ["ADMINISTRADOR"],
  cancelar: ["ADMINISTRADOR"],
};

/** Ações de transição visíveis no detalhe (RN12). A API continua sendo a autoridade (RNF-03). */
export function acoesDisponiveis(
  c: Pick<Schemas["Contrato"], "status" | "criado_por_id">,
  papel: Papel,
  usuarioId: number,
): AcaoContrato[] {
  return ACOES_POR_STATUS[c.status].filter(
    (a) => PERMISSOES[a].includes(papel) && !(a === "aprovar" && c.criado_por_id === usuarioId),
  );
}

const TODOS: Papel[] = ["ADMINISTRADOR", "FINANCEIRO", "MOTORISTA", "CLIENTE"];
export const MENU: { to: string; label: string; icone: string; papeis: Papel[] }[] = [
  { to: "/", label: "Painel", icone: "home", papeis: TODOS },
  { to: "/usuarios", label: "Usuários", icone: "users", papeis: ["ADMINISTRADOR"] },
  {
    to: "/cooperados",
    label: "Cooperados",
    icone: "user",
    papeis: ["ADMINISTRADOR", "FINANCEIRO"],
  },
  {
    to: "/clientes",
    label: "Clientes",
    icone: "brief",
    papeis: ["ADMINISTRADOR", "FINANCEIRO", "MOTORISTA"],
  },
  { to: "/contratos", label: "Contratos", icone: "doc", papeis: TODOS },
  { to: "/pagamentos", label: "Pagamentos", icone: "coin", papeis: TODOS },
  {
    to: "/despesas",
    label: "Despesas",
    icone: "down",
    papeis: ["ADMINISTRADOR", "FINANCEIRO", "MOTORISTA"],
  },
  {
    to: "/relatorios",
    label: "Relatórios",
    icone: "chart",
    papeis: ["ADMINISTRADOR", "FINANCEIRO", "MOTORISTA"],
  },
];
export const pode = {
  baixaRepasse: (p: Papel) => p === "FINANCEIRO",
  estorno: (p: Papel) => p === "FINANCEIRO" || p === "ADMINISTRADOR",
  verTaxa: (p: Papel) => p !== "CLIENTE",
};
