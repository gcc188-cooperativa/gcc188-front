import { Alert, Button, Paper, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
import { useState } from "react";
import { api, msgErro } from "../../shared/api/client";
import { useSession } from "./session";

export function LoginPage() {
  const { setUser } = useSession();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [busy, setBusy] = useState(false);
  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErro("");
    const r = await api.POST("/auth/login", { body: { email, senha } });
    setBusy(false);
    if (r.error) setErro(msgErro(r.error));
    else setUser(r.data!);
  }
  return (
    <Stack align="center" mt={96} px="md">
      <Paper withBorder p="xl" radius="md" w="100%" maw={400}>
        <form onSubmit={entrar}>
          <Stack>
            <Title order={2}>Entrar na cooperativa</Title>
            {erro && <Alert color="red">{erro}</Alert>}
            <TextInput
              label="E-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              autoComplete="username"
            />
            <PasswordInput
              label="Senha"
              required
              value={senha}
              onChange={(e) => setSenha(e.currentTarget.value)}
              autoComplete="current-password"
            />
            <Button type="submit" loading={busy}>
              Entrar
            </Button>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
