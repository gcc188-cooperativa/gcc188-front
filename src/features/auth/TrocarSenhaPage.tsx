import { Button, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { api } from "../../shared/api/client";
import { Campo, aplicarErros } from "../../shared/ui/form";
import { Logo } from "../../shared/ui/Logo";
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
    <form onSubmit={form.onSubmit(salvar)}>
      <Paper withBorder shadow="sm" radius="md" p="xl" maw={420} mx="auto" mt={64}>
        <Logo />
        <Title order={2}>Defina sua senha</Title>
        <Text c="dimmed" size="sm" mb="md">
          Use ao menos 12 caracteres.
        </Text>
        <Stack gap="md" mb="md">
          <Campo form={form} name="senha_atual" label="Senha atual" type="password" />
          <Campo form={form} name="nova_senha" label="Nova senha" type="password" />
        </Stack>
        <Group gap="xs">
          <Button type="submit">Salvar senha</Button>
          <Button type="button" variant="default" onClick={logout}>
            Sair
          </Button>
        </Group>
      </Paper>
    </form>
  );
}
