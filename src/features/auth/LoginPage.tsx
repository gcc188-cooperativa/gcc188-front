import { Button, PasswordInput, TextInput } from "@mantine/core";
import { useState } from "react";
import { api, msgErro } from "../../shared/api/client";
import { Icone } from "../../shared/ui/icons";
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
    <form className="card login" onSubmit={entrar}>
      <p className="logo">Cooperativa</p>
      <h2 style={{ marginBottom: 14 }}>Entrar na cooperativa</h2>
      {erro && (
        <div className="msg" role="alert" style={{ marginBottom: 10 }}>
          <Icone n="alert" />
          <span>{erro}</span>
        </div>
      )}
      <TextInput
        mb="sm"
        label="E-mail"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.currentTarget.value)}
      />
      <PasswordInput
        mb="md"
        label="Senha"
        autoComplete="current-password"
        value={senha}
        onChange={(e) => setSenha(e.currentTarget.value)}
      />
      <Button variant="default" className="bt pri" type="submit" disabled={busy}>
        Entrar
      </Button>
    </form>
  );
}
