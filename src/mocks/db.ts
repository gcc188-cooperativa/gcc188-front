const t = "2026-11-10T13:00:00Z";
const b = () => ({ versao: 0, criado_em: t, atualizado_em: t });
const u = (id: number, nome: string, email: string, papel: string, extra = {}) => ({
  id,
  nome,
  email,
  papel,
  ativo: true,
  deve_trocar_senha: false,
  ...extra,
  ...b(),
});
export type Contrato = {
  id: number;
  status: string;
  descricao: string;
  valor_total: number;
  modalidade: string;
  num_parcelas: number;
  dia_vencimento: number | null;
  data_inicio: string;
  data_fim: string | null;
  taxa_tipo: string;
  taxa_valor: number;
  motivo_reprovacao: string | null;
  aprovado_por_id: number | null;
  aprovado_em: string | null;
  criado_por_id: number;
  cooperado_id: number;
  cliente_id: number;
  versao: number;
  criado_em: string;
  atualizado_em: string;
};
export type Pagamento = {
  id: number;
  contrato_id: number;
  numero_parcela: number;
  data_vencimento: string;
  valor_bruto: number;
  valor_taxa: number;
  valor_liquido: number;
  status: string;
  data_baixa: string | null;
  baixado_por_id: number | null;
  data_repasse: string | null;
  repassado_por_id: number | null;
  observacao: string | null;
  versao: number;
  criado_em: string;
  atualizado_em: string;
};
const contrato = (id: number, o: Partial<Contrato>): Contrato => ({
  id,
  status: "RASCUNHO",
  descricao: "Transporte de insumos, rota Lavras–BH",
  valor_total: 6000,
  modalidade: "MENSAL",
  num_parcelas: 3,
  dia_vencimento: 12,
  data_inicio: "2026-10-12",
  data_fim: null,
  taxa_tipo: "PERCENTUAL",
  taxa_valor: 10,
  motivo_reprovacao: null,
  aprovado_por_id: null,
  aprovado_em: null,
  criado_por_id: 3,
  cooperado_id: 1,
  cliente_id: 1,
  ...o,
  ...b(),
});
const pag = (
  id: number,
  contrato_id: number,
  n: number,
  v: string,
  status: string,
  bruto = 2000,
  taxa = 200,
) => ({
  id,
  contrato_id,
  numero_parcela: n,
  data_vencimento: v,
  valor_bruto: bruto,
  valor_taxa: taxa,
  valor_liquido: bruto - taxa,
  status,
  data_baixa: status === "PREVISTO" ? null : v,
  baixado_por_id: null,
  data_repasse: status === "REPASSADO" ? v : null,
  repassado_por_id: null,
  observacao: null,
  ...b(),
});

/** Dados fictícios em memória (também usados nos testes). Cenários: pendente, rascunho, atraso. */
export const seed = () => ({
  usuarios: [
    u(1, "Marina Lopes", "adm@coop.example", "ADMINISTRADOR"),
    u(2, "Rafael Costa", "fin@coop.example", "FINANCEIRO"),
    u(3, "Carlos Mendes", "mot@coop.example", "MOTORISTA"),
    u(4, "Transportes Alvorada", "cli@coop.example", "CLIENTE"),
    u(5, "Novo Usuário", "novo@coop.example", "FINANCEIRO", { deve_trocar_senha: true }),
  ],
  cooperados: [
    {
      id: 1,
      usuario_id: 3,
      matricula: "0042",
      nome: "Carlos Mendes",
      cpf: "12345678909",
      telefone: null,
      data_ingresso: "2019-03-01",
      ativo: true,
      ...b(),
    },
    {
      id: 2,
      usuario_id: 0,
      matricula: "0057",
      nome: "Joana Reis",
      cpf: "98765432100",
      telefone: null,
      data_ingresso: "2021-08-01",
      ativo: true,
      ...b(),
    },
  ],
  clientes: [
    {
      id: 1,
      usuario_id: 4,
      nome: "Transportes Alvorada",
      documento: "12345678000190",
      telefone: null,
      email_contato: null,
      ativo: true,
      ...b(),
    },
    {
      id: 2,
      usuario_id: 0,
      nome: "Distribuidora Serra",
      documento: "98765432000110",
      telefone: null,
      email_contato: null,
      ativo: true,
      ...b(),
    },
  ],
  contratos: [
    contrato(148, { status: "ATIVO", aprovado_por_id: 1, aprovado_em: t }),
    contrato(131, {
      status: "ATIVO",
      cliente_id: 2,
      valor_total: 5700,
      taxa_tipo: "FIXO",
      taxa_valor: 50,
      num_parcelas: 6,
      aprovado_por_id: 1,
    }),
    contrato(152, {
      status: "PENDENTE_APROVACAO",
      cooperado_id: 2,
      criado_por_id: 2,
      descricao: "Mudança de maquinário",
    }),
    contrato(155, {
      status: "RASCUNHO",
      taxa_valor: 8,
      descricao: "Abastecimento mensal de loja",
      valor_total: 3000,
      num_parcelas: 2,
    }),
  ],
  pagamentos: [
    pag(1, 148, 1, "2026-10-12", "PAGO"),
    pag(2, 148, 2, "2026-12-12", "PREVISTO"),
    pag(3, 148, 3, "2027-01-12", "PREVISTO"),
    pag(4, 131, 5, "2026-10-28", "PREVISTO", 950, 50),
  ],
  despesas: [
    {
      id: 1,
      origem: "COOPERATIVA",
      categoria: "ADMINISTRATIVA",
      descricao: "Aluguel da sede",
      valor: 1800,
      data_despesa: "2026-11-05",
      cooperado_id: null,
      contrato_id: null,
      registrado_por_id: 1,
      ...b(),
    },
    {
      id: 2,
      origem: "COOPERADO",
      categoria: "COMBUSTIVEL",
      descricao: "Abastecimento rota BH",
      valor: 340,
      data_despesa: "2026-11-03",
      cooperado_id: 1,
      contrato_id: 148,
      registrado_por_id: 3,
      ...b(),
    },
  ],
});
export let db = seed();
export const resetDb = () => {
  db = seed();
};
export type Usuario = ReturnType<typeof seed>["usuarios"][number];
export const me = (): Usuario | undefined =>
  db.usuarios.find((x) => x.id === Number(sessionStorage.getItem("mock-user")));
export const vinculo = (x: Usuario) =>
  (x.papel === "MOTORISTA"
    ? db.cooperados.find((c) => c.usuario_id === x.id)?.id
    : x.papel === "CLIENTE"
      ? db.clientes.find((c) => c.usuario_id === x.id)?.id
      : null) ?? null;
