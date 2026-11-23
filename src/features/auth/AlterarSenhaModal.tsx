import { Button, Modal, PasswordInput, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { api } from "../../shared/api/client";
import { aplicarErros } from "../../shared/ui/crud";

/** UC05: o próprio usuário altera a senha informando a atual. */
export function AlterarSenhaModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const form = useForm({ initialValues: { senha_atual: "", nova_senha: "" } });
  async function salvar(v: { senha_atual: string; nova_senha: string }) {
    const r = await api.POST("/auth/alterar-senha", { body: v });
    if (r.error) return aplicarErros(form, r.error);
    notifications.show({ color: "teal", message: "Senha alterada." });
    form.reset();
    onClose();
  }
  return (
    <Modal opened={opened} onClose={onClose} title="Alterar senha">
      <form onSubmit={form.onSubmit(salvar)}>
        <Stack>
          <PasswordInput label="Senha atual" required {...form.getInputProps("senha_atual")} />
          <PasswordInput
            label="Nova senha (mínimo 12 caracteres)"
            required
            {...form.getInputProps("nova_senha")}
          />
          <Button type="submit">Salvar senha</Button>
        </Stack>
      </form>
    </Modal>
  );
}
