import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "../../app/App";
import { NOVO, renderApp } from "../../test/utils";

async function entrar(email: string, senha: string) {
  const u = userEvent.setup();
  await u.type(await screen.findByLabelText(/E-mail/), email);
  await u.type(screen.getByLabelText(/Senha/), senha);
  await u.click(screen.getByRole("button", { name: "Entrar" }));
}
describe("autenticação", () => {
  it("mostra erro com credenciais inválidas", async () => {
    renderApp(<App />, { porta: false });
    await entrar("fin@coop.example", "errada");
    expect(await screen.findByText("Credenciais inválidas.")).not.toBeNull();
  });
  it("entra e mostra o painel do papel", async () => {
    renderApp(<App />, { porta: false });
    await entrar("fin@coop.example", "senha-correta-123");
    expect(await screen.findByRole("heading", { name: /, Rafael$/ })).not.toBeNull();
    expect(screen.queryByRole("link", { name: /Usuários/ })).toBeNull(); // menu só do administrador
  });
  it("exige a troca de senha no primeiro acesso (CA-15)", async () => {
    renderApp(<App />, { porta: false });
    await entrar("novo@coop.example", "senha-correta-123");
    expect(await screen.findByText("Defina sua senha")).not.toBeNull();
  });
  it("volta ao login quando a sessão expira", async () => {
    renderApp(<App />, { como: NOVO + 1, porta: false }); // usuário inexistente: /auth/me responde 401
    expect(await screen.findByText("Entrar na cooperativa")).not.toBeNull();
  });
  it("alterna o menu lateral e o tema", async () => {
    renderApp(<App />, { como: 1, porta: false });
    const u = userEvent.setup();
    await u.click(await screen.findByRole("button", { name: "Recolher menu" }));
    expect(screen.getByRole("button", { name: "Expandir menu" })).not.toBeNull();
    await u.click(screen.getByRole("button", { name: "Claro/escuro" }));
    expect(document.documentElement.getAttribute("data-theme")).toMatch(/dark|light/);
  });
});
