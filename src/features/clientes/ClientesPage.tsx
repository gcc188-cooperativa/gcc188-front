import { api, ok } from "../../shared/api/client";
import { CadastroLista, SituacaoBadge, type CadastroCfg, type Row } from "../../shared/ui/cadastro";
import { useSession } from "../auth/session";

const doc = (d: string) =>
  d.length === 14
    ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    : d.length === 11
      ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
      : d;
export const clientesCfg = (escreve: boolean): CadastroCfg => ({
  chave: "clientes",
  base: "/clientes",
  singular: "cliente",
  titulo: "Clientes",
  sub: "Quem contrata os serviços.",
  subNovo: "O cadastro cria também o acesso do cliente.",
  busca: "Buscar por nome ou documento",
  podeEscrever: escreve,
  colunas: [
    { t: "Nome", r: (r) => String(r.nome), o: (r) => String(r.nome) },
    { t: "Documento", r: (r) => doc(String(r.documento)) },
    { t: "Telefone", r: (r) => String(r.telefone ?? "—") },
    { t: "Situação", r: (r) => <SituacaoBadge r={{ ...r, ativo: r.ativo !== false }} /> },
  ],
  secoes: [
    {
      titulo: "Dados do cliente",
      campos: [
        { name: "nome", label: "Nome ou razão social" },
        { name: "documento", label: "CPF ou CNPJ (somente dígitos)" },
        { name: "telefone", label: "Telefone" },
        { name: "email_contato", label: "E-mail de contato", type: "email" },
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
      await api.GET("/clientes", {
        params: { query: { page, size: 20, nome: busca || undefined, ativo } },
      }),
    ) as unknown as { content: Row[]; total_pages: number },
  obter: async (id) =>
    ok(await api.GET("/clientes/{id}", { params: { path: { id } } })) as unknown as Row,
  criar: (v) => api.POST("/clientes", { body: v as never }),
  atualizar: (r, v) =>
    api.PUT("/clientes/{id}", { params: { path: { id: r.id } }, body: v as never }),
  situacao: (id, ativo) =>
    api.PATCH("/clientes/{id}/situacao", { params: { path: { id } }, body: { ativo } }),
});
export const useClientesCfg = () => clientesCfg(useSession().user!.papel === "ADMINISTRADOR");
export const ClientesPage = () => <CadastroLista cfg={useClientesCfg()} />;
