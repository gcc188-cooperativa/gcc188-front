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

export const MENU: { to: string; label: string; papeis: Papel[] }[] = [
  { to: "/", label: "Painel", papeis: ["ADMINISTRADOR", "FINANCEIRO", "MOTORISTA", "CLIENTE"] },
  { to: "/usuarios", label: "Usuários", papeis: ["ADMINISTRADOR"] },
  {
    to: "/contratos",
    label: "Contratos",
    papeis: ["ADMINISTRADOR", "FINANCEIRO", "MOTORISTA", "CLIENTE"],
  },
  { to: "/cooperados", label: "Cooperados", papeis: ["ADMINISTRADOR", "FINANCEIRO"] },
  { to: "/clientes", label: "Clientes", papeis: ["ADMINISTRADOR", "FINANCEIRO", "MOTORISTA"] },
  {
    to: "/pagamentos",
    label: "Pagamentos",
    papeis: ["ADMINISTRADOR", "FINANCEIRO", "MOTORISTA", "CLIENTE"],
  },
  { to: "/despesas", label: "Despesas", papeis: ["ADMINISTRADOR", "FINANCEIRO", "MOTORISTA"] },
  { to: "/relatorios", label: "Relatórios", papeis: ["ADMINISTRADOR", "FINANCEIRO", "MOTORISTA"] },
];
export const pode = {
  baixaRepasse: (p: Papel) => p === "FINANCEIRO",
  estorno: (p: Papel) => p === "FINANCEIRO" || p === "ADMINISTRADOR",
  verTaxa: (p: Papel) => p !== "CLIENTE",
};
