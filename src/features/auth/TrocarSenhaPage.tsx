import { Button, Paper, PasswordInput, Stack, Title, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { api, msgErro } from "../../shared/api/client";
import { useSession } from "./session";

/** CA-15: enquanto deve_trocar_senha, só a troca e o logout são aceitos. */
export function TrocarSenhaPage() {
  const { user, setUser, logout } = useSession();
  const [a, setA] = useState("");
  const [n, setN] = useState("");
  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const r = await api.POST("/auth/alterar-senha", { body: { senha_atual: a, nova_senha: n } });
    if (r.error) return void notifications.show({ color: "red", message: msgErro(r.error) });
    notifications.show({ color: "teal", message: "Senha alterada." });
    setUser({ ...user!, deve_trocar_senha: false });
  }
  return (
    <Stack align="center" mt={96} px="md">
      <Paper withBorder p="xl" w="100%" maw={400}>
        <form onSubmit={salvar}>
          <Stack>
            <Title order={2}>Defina sua senha</Title>
            <Text c="dimmed">Use ao menos 12 caracteres.</Text>
            <PasswordInput
              label="Senha atual"
              required
              value={a}
              onChange={(e) => setA(e.currentTarget.value)}
            />
            <PasswordInput
              label="Nova senha"
              required
              minLength={12}
              value={n}
              onChange={(e) => setN(e.currentTarget.value)}
            />
            <Button type="submit">Salvar senha</Button>
            <Button variant="subtle" onClick={logout}>
              Sair
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
