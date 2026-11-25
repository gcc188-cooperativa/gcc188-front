import { Button, Group, Modal, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { api } from "../../shared/api/client";
import { Campo, aplicarErros } from "../../shared/ui/form";
import { toast } from "../../shared/ui/toast";

/** UC05: o próprio usuário altera a senha informando a atual. */
export function AlterarSenhaModal({ onClose }: { onClose: () => void }) {
  const form = useForm({ initialValues: { senha_atual: "", nova_senha: "" } });
  async function salvar(v: { senha_atual: string; nova_senha: string }) {
    const r = await api.POST("/auth/alterar-senha", { body: v });
    if (r.error) return aplicarErros(form, r.error);
    toast("Senha alterada.");
    onClose();
  }
  return (
    <Modal opened onClose={onClose} title="Alterar senha" centered>
      <form onSubmit={form.onSubmit(salvar)}>
        <Stack gap="md" mb="md">
          <Campo form={form} name="senha_atual" label="Senha atual" type="password" />
          <Campo
            form={form}
            name="nova_senha"
            label="Nova senha (mínimo 12 caracteres)"
            type="password"
          />
        </Stack>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Voltar
          </Button>
          <Button type="submit">Salvar senha</Button>
        </Group>
      </form>
    </Modal>
  );
}
