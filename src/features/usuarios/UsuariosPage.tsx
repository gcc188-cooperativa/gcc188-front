import { api, msgErro, ok } from "../../shared/api/client";
import { PAPEL } from "../../shared/ui";
import { CadastroLista, SituacaoBadge, type CadastroCfg, type Row } from "../../shared/ui/cadastro";
import { confirmar } from "../../shared/ui/confirm";
import { toast } from "../../shared/ui/toast";

const papeis = Object.entries(PAPEL).map(([value, label]) => ({
  value: value as never as string,
  label,
}));
export const usuariosCfg: CadastroCfg = {
  chave: "usuarios",
  base: "/usuarios",
  singular: "usuário",
  titulo: "Usuários",
  sub: "Quem acessa o sistema e com qual papel.",
  subNovo: "A pessoa troca a senha no primeiro acesso.",
  opcoesPapel: papeis,
  podeEscrever: true,
  colunas: [
    { t: "Nome", r: (r) => String(r.nome), o: (r) => String(r.nome) },
    { t: "E-mail", r: (r) => String(r.email), o: (r) => String(r.email) },
    { t: "Papel", r: (r) => PAPEL[String(r.papel)], o: (r) => String(r.papel) },
    { t: "Situação", r: (r) => <SituacaoBadge r={r} />, o: (r) => (r.ativo ? 0 : 1) },
  ],
  secoes: [
    {
      titulo: "Dados do usuário",
      campos: [
        { name: "nome", label: "Nome" },
        { name: "email", label: "E-mail", type: "email" },
        { name: "papel", label: "Papel", opcoes: papeis },
        {
          name: "senha",
          label: "Senha temporária",
          type: "password",
          criacao: true,
          hint: "Mínimo de 12 caracteres. A pessoa troca no primeiro acesso.",
        },
      ],
    },
  ],
  listar: async ({ page, ativo, papel }) =>
    ok(
      await api.GET("/usuarios", {
        params: { query: { page, size: 20, ativo, ...(papel ? { papel: papel as never } : {}) } },
      }),
    ) as unknown as { content: Row[]; total_pages: number },
  obter: async (id) =>
    ok(await api.GET("/usuarios/{id}", { params: { path: { id } } })) as unknown as Row,
  criar: (v) => api.POST("/usuarios", { body: v as never }),
  atualizar: (r, v) =>
    api.PUT("/usuarios/{id}", {
      params: { path: { id: r.id } },
      body: { ...v, versao: r.versao } as never,
    }),
  situacao: (id, ativo) =>
    api.PATCH("/usuarios/{id}/situacao", { params: { path: { id } }, body: { ativo } }),
  extra: (r) => [
    {
      rotulo: "Redefinir senha",
      fazer: () =>
        confirmar({
          titulo: "Redefinir senha?",
          mensagem: "A pessoa precisará trocar a senha no próximo acesso.",
          campo: { rotulo: "Senha temporária (mínimo 12 caracteres)", tipo: "password" },
          aoConfirmar: async (senha_temporaria) => {
            const x = await api.POST("/usuarios/{id}/redefinicao-senha", {
              params: { path: { id: r.id } },
              body: { senha_temporaria },
            });
            toast(x.error ? msgErro(x.error) : "Senha redefinida.", !!x.error);
          },
        }),
    },
  ],
};
export const UsuariosPage = () => <CadastroLista cfg={usuariosCfg} />;
