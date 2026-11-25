import { Button } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { api, msgErro, ok } from "../../shared/api/client";
import { CrudPage, type CrudConfig, type Row } from "../../shared/ui/crud";
import { StatusBadge } from "../../shared/ui";

const redefinir = async (id: number) => {
  const senha_temporaria = window.prompt("Senha temporária (mínimo 12 caracteres):");
  if (!senha_temporaria) return;
  const r = await api.POST("/usuarios/{id}/redefinicao-senha", {
    params: { path: { id } },
    body: { senha_temporaria },
  });
  notifications.show(
    r.error
      ? { color: "red", message: msgErro(r.error) }
      : { color: "teal", message: "Senha redefinida; a troca será exigida no próximo acesso." },
  );
};
const cfg: CrudConfig = {
  titulo: "Usuários",
  sub: "Quem acessa o sistema e com qual papel.",
  chave: "usuarios",
  podeEscrever: true,
  campos: [
    { name: "nome", label: "Nome", obrigatorio: true },
    { name: "email", label: "E-mail", type: "email", obrigatorio: true },
    {
      name: "papel",
      label: "Papel",
      opcoes: ["ADMINISTRADOR", "FINANCEIRO", "MOTORISTA", "CLIENTE"],
      obrigatorio: true,
    },
    {
      name: "senha",
      label: "Senha temporária",
      type: "password",
      criacao: true,
      obrigatorio: true,
    },
  ],
  colunas: [
    { titulo: "Nome", render: (r) => String(r.nome) },
    { titulo: "E-mail", render: (r) => String(r.email) },
    { titulo: "Papel", render: (r) => String(r.papel) },
    { titulo: "Situação", render: (r) => <StatusBadge s={r.ativo ? "ATIVO" : "CANCELADO"} /> },
  ],
  listar: async (page) =>
    ok(await api.GET("/usuarios", { params: { query: { page, size: 20 } } })) as unknown as {
      content: Row[];
      total_pages: number;
    },
  criar: (v) => api.POST("/usuarios", { body: v as never }),
  atualizar: (r, v) =>
    api.PUT("/usuarios/{id}", {
      params: { path: { id: r.id } },
      body: { ...v, versao: r.versao } as never,
    }),
  situacao: (id, ativo) =>
    api.PATCH("/usuarios/{id}/situacao", { params: { path: { id } }, body: { ativo } }),
  extra: (r) => (
    <Button size="xs" variant="default" onClick={() => redefinir(r.id)}>
      Redefinir senha
    </Button>
  ),
};
export const UsuariosPage = () => <CrudPage cfg={cfg} />;
