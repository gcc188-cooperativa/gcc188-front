import { Button, Modal } from "@mantine/core";
import { useForm } from "@mantine/form";
import { api } from "../../shared/api/client";
import { Campo, aplicarErros } from "../../shared/ui/form";
import { toast } from "../../shared/ui/toast";

/** UC05: o próprio usuário altera a senha informando a atual. */
export function AlterarSenhaModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const form = useForm({ initialValues: { senha_atual: "", nova_senha: "" } });
  async function salvar(v: { senha_atual: string; nova_senha: string }) {
    const r = await api.POST("/auth/alterar-senha", { body: v });
    if (r.error) return aplicarErros(form, r.error);
    toast("Senha alterada.");
    form.reset();
    onClose();
  }
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Alterar senha"
      centered
      size={420}
      transitionProps={{ duration: 0 }}
      classNames={{ content: "dlg", title: "dlg-t" }}
    >
      <form onSubmit={form.onSubmit(salvar)}>
        <Campo form={form} name="senha_atual" label="Senha atual" type="password" />
        <Campo
          form={form}
          name="nova_senha"
          label="Nova senha (mínimo 12 caracteres)"
          type="password"
        />
        <div className="acts" style={{ justifyContent: "flex-end" }}>
          <Button variant="default" className="bt" onClick={onClose}>
            Voltar
          </Button>
          <Button variant="default" className="bt pri" type="submit">
            Salvar senha
          </Button>
        </div>
      </form>
    </Modal>
  );
}
