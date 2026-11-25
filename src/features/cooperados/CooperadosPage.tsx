import dayjs from "dayjs";
import { api, ok } from "../../shared/api/client";
import { CadastroLista, SituacaoBadge, type CadastroCfg, type Row } from "../../shared/ui/cadastro";

const cpfMascarado = (c: string) =>
  c.length === 11 ? `•••.${c.slice(3, 6)}.${c.slice(6, 9)}-••` : c;
export const cooperadosCfg: CadastroCfg = {
  chave: "cooperados",
  base: "/cooperados",
  singular: "cooperado",
  titulo: "Cooperados",
  sub: "Motoristas associados à cooperativa.",
  subNovo: "O cadastro cria também o acesso do motorista, tudo de uma vez.",
  busca: "Buscar por nome ou matrícula",
  podeEscrever: true,
  colunas: [
    { t: "Matrícula", r: (r) => String(r.matricula), o: (r) => String(r.matricula) },
    { t: "Nome", r: (r) => String(r.nome), o: (r) => String(r.nome) },
    { t: "CPF", r: (r) => cpfMascarado(String(r.cpf)) },
    {
      t: "Ingresso",
      r: (r) => dayjs(String(r.data_ingresso)).format("MM/YYYY"),
      o: (r) => String(r.data_ingresso),
    },
    { t: "Situação", r: (r) => <SituacaoBadge r={r} />, o: (r) => (r.ativo ? 0 : 1) },
  ],
  secoes: [
    {
      titulo: "Dados do cooperado",
      campos: [
        { name: "nome", label: "Nome completo" },
        { name: "cpf", label: "CPF (somente dígitos)" },
        { name: "matricula", label: "Matrícula" },
        { name: "telefone", label: "Telefone" },
        { name: "data_ingresso", label: "Data de ingresso", type: "date" },
      ],
    },
    {
      titulo: "Acesso ao sistema",
      campos: [
        { name: "usuario.email", label: "E-mail de acesso", type: "email", criacao: true },
        {
          name: "usuario.senha",
          label: "Senha temporária",
          type: "password",
          criacao: true,
          hint: "A pessoa troca a senha no primeiro acesso.",
        },
      ],
    },
  ],
  listar: async ({ page, busca, ativo }) =>
    ok(
      await api.GET("/cooperados", {
        params: { query: { page, size: 20, nome: busca || undefined, ativo } },
      }),
    ) as unknown as { content: Row[]; total_pages: number },
  obter: async (id) =>
    ok(await api.GET("/cooperados/{id}", { params: { path: { id } } })) as unknown as Row,
  criar: (v) => api.POST("/cooperados", { body: v as never }),
  atualizar: (r, v) =>
    api.PUT("/cooperados/{id}", { params: { path: { id: r.id } }, body: v as never }),
  situacao: (id, ativo) =>
    api.PATCH("/cooperados/{id}/situacao", { params: { path: { id } }, body: { ativo } }),
};
export const CooperadosPage = () => <CadastroLista cfg={cooperadosCfg} />;
