import { api, ok } from "../../shared/api/client";
import { Data, StatusBadge } from "../../shared/ui";
import { CrudPage, type CrudConfig, type Row } from "../../shared/ui/crud";

const cfg: CrudConfig = {
  titulo: "Cooperados",
  sub: "Motoristas associados. O cadastro cria também o acesso do motorista.",
  chave: "cooperados",
  busca: true,
  podeEscrever: true,
  campos: [
    { name: "nome", label: "Nome completo", obrigatorio: true },
    { name: "matricula", label: "Matrícula", obrigatorio: true },
    { name: "cpf", label: "CPF (somente dígitos)", obrigatorio: true },
    { name: "telefone", label: "Telefone" },
    { name: "data_ingresso", label: "Data de ingresso", type: "date", obrigatorio: true },
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
    { titulo: "Matrícula", render: (r) => String(r.matricula) },
    { titulo: "Nome", render: (r) => String(r.nome) },
    { titulo: "Ingresso", render: (r) => <Data v={r.data_ingresso as string} /> },
    { titulo: "Situação", render: (r) => <StatusBadge s={r.ativo ? "ATIVO" : "CANCELADO"} /> },
  ],
  listar: async (page, busca) =>
    ok(
      await api.GET("/cooperados", {
        params: { query: { page, size: 20, nome: busca || undefined } },
      }),
    ) as unknown as { content: Row[]; total_pages: number },
  criar: (v) => api.POST("/cooperados", { body: v as never }),
  atualizar: (r, v) =>
    api.PUT("/cooperados/{id}", { params: { path: { id: r.id } }, body: v as never }),
  situacao: (id, ativo) =>
    api.PATCH("/cooperados/{id}/situacao", { params: { path: { id } }, body: { ativo } }),
};
export const CooperadosPage = () => <CrudPage cfg={cfg} />;
