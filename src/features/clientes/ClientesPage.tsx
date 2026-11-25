import { api, ok } from "../../shared/api/client";
import { StatusBadge } from "../../shared/ui";
import { CrudPage, type CrudConfig, type Row } from "../../shared/ui/crud";
import { useSession } from "../auth/session";

export function ClientesPage() {
  const escreve = useSession().user!.papel === "ADMINISTRADOR";
  const cfg: CrudConfig = {
    titulo: "Clientes",
    sub: "Quem contrata os serviços. O cadastro cria também o acesso do cliente.",
    chave: "clientes",
    busca: true,
    podeEscrever: escreve,
    campos: [
      { name: "nome", label: "Nome ou razão social", obrigatorio: true },
      { name: "documento", label: "CPF ou CNPJ (somente dígitos)", obrigatorio: true },
      { name: "telefone", label: "Telefone" },
      { name: "email_contato", label: "E-mail de contato", type: "email" },
      {
        name: "usuario.email",
        label: "E-mail de acesso",
        type: "email",
        criacao: true,
        obrigatorio: true,
      },
      {
        name: "usuario.senha",
        label: "Senha temporária",
        type: "password",
        criacao: true,
        obrigatorio: true,
      },
    ],
    colunas: [
      { titulo: "Nome", render: (r) => String(r.nome) },
      { titulo: "Documento", render: (r) => String(r.documento) },
      { titulo: "Telefone", render: (r) => String(r.telefone ?? "—") },
      {
        titulo: "Situação",
        render: (r) => <StatusBadge s={r.ativo === false ? "CANCELADO" : "ATIVO"} />,
      },
    ],
    listar: async (page, busca) =>
      ok(
        await api.GET("/clientes", {
          params: { query: { page, size: 20, nome: busca || undefined } },
        }),
      ) as unknown as { content: Row[]; total_pages: number },
    criar: (v) => api.POST("/clientes", { body: v as never }),
    atualizar: (r, v) =>
      api.PUT("/clientes/{id}", { params: { path: { id: r.id } }, body: v as never }),
    situacao: (id, ativo) =>
      api.PATCH("/clientes/{id}/situacao", { params: { path: { id } }, body: { ativo } }),
  };
  return <CrudPage cfg={cfg} />; // ao motorista a API devolve só identificação (RN10)
}
