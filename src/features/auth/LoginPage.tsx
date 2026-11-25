import { Alert, Button, Paper, PasswordInput, Stack, TextInput, Title } from "@mantine/core";
import { useState } from "react";
import { api, msgErro } from "../../shared/api/client";
import { Logo } from "../../shared/ui/Logo";
import { useSession } from "./session";

export function LoginPage() {
  const { setUser } = useSession();
  const [email, setEmail] = useState(""),
    [senha, setSenha] = useState(""),
    [erro, setErro] = useState(""),
    [busy, setBusy] = useState(false);
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
    <form onSubmit={entrar}>
      <Paper withBorder shadow="sm" radius="md" p="xl" maw={420} mx="auto" mt={64}>
        <Logo />
        <Title order={2} mb="md">
          Entrar na cooperativa
        </Title>
        {erro && (
          <Alert color="red" mb="md" role="alert">
            {erro}
          </Alert>
        )}
        <Stack gap="md">
          <TextInput
            label="E-mail"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
          />
          <PasswordInput
            label="Senha"
            autoComplete="current-password"
            visibilityToggleButtonProps={{ "aria-label": "Mostrar" }}
            value={senha}
            onChange={(e) => setSenha(e.currentTarget.value)}
            required
          />
          <Button type="submit" loading={busy} fullWidth>
            Entrar
          </Button>
        </Stack>
      </Paper>
    </form>
  );
}
