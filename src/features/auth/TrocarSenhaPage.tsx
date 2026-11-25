import { Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { api } from "../../shared/api/client";
import { Campo, aplicarErros } from "../../shared/ui/form";
import { toast } from "../../shared/ui/toast";
import { useSession } from "./session";

/** CA-15: enquanto deve_trocar_senha, só a troca e o logout são aceitos. */
export function TrocarSenhaPage() {
  const { user, setUser, logout } = useSession();
  const form = useForm({ initialValues: { senha_atual: "", nova_senha: "" } });
  async function salvar(v: { senha_atual: string; nova_senha: string }) {
    const r = await api.POST("/auth/alterar-senha", { body: v });
    if (r.error) return aplicarErros(form, r.error);
    toast("Senha alterada.");
    setUser({ ...user!, deve_trocar_senha: false });
  }
  return (
    <form className="card login" onSubmit={form.onSubmit(salvar)}>
      <p className="logo">Cooperativa</p>
      <h2>Defina sua senha</h2>
      <p className="sub" style={{ marginBottom: 14 }}>
        Use ao menos 12 caracteres.
      </p>
      <Campo form={form} name="senha_atual" label="Senha atual" type="password" />
      <Campo form={form} name="nova_senha" label="Nova senha" type="password" />
      <div className="acts lg">
        <Button variant="default" className="bt pri" type="submit">
          Salvar senha
        </Button>
        <Button variant="default" className="bt" type="button" onClick={logout}>
          Sair
        </Button>
      </div>
    </form>
  );
}
