import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ADM, MOT, renderApp } from "../test/utils";
import { CadastroForm } from "../shared/ui/cadastro";
import { CooperadosPage, cooperadosCfg } from "./cooperados/CooperadosPage";
import { DespesaFormPage } from "./despesas/DespesaFormPage";
import { PainelPage } from "./painel/PainelPage";
import { RelatoriosPage } from "./relatorios/RelatoriosPage";

describe("cadastros", () => {
  it("lista cooperados com CPF mascarado e situação", async () => {
    renderApp(<CooperadosPage />, { como: ADM });
    expect(await screen.findByText("•••.456.789-••")).not.toBeNull();
    expect(screen.getAllByText("Ativo").length).toBeGreaterThan(0);
  });
  it("cria cooperado com usuário e mostra conflito de e-mail junto ao campo", async () => {
    renderApp(
      <Routes>
        <Route path="/cooperados/novo" element={<CadastroForm cfg={cooperadosCfg} />} />
      </Routes>,
      { como: ADM, rota: "/cooperados/novo" },
    );
    const u = userEvent.setup();
    await u.type(await screen.findByLabelText(/Nome completo/), "Paulo Nunes");
    await u.type(screen.getByLabelText(/Matrícula/), "0099");
    await u.type(screen.getByLabelText(/CPF/), "11122233344");
    await u.type(screen.getByLabelText(/Data de ingresso/), "2026-01-10");
    await u.type(screen.getByLabelText(/E-mail de acesso/), "mot@coop.example");
    await u.type(screen.getByLabelText(/Senha temporária/), "uma-senha-longa-1");
    await u.click(screen.getByRole("button", { name: "Salvar cadastro" }));
    expect(await screen.findByText("E-mail já cadastrado.")).not.toBeNull();
  });
});
describe("despesas e relatórios", () => {
  it("registra despesa da cooperativa", async () => {
    renderApp(<DespesaFormPage />, { como: ADM });
    const u = userEvent.setup();
    await u.type(await screen.findByLabelText(/Valor/), "10");
    await u.type(screen.getByLabelText("Data"), "2026-11-01");
    await u.type(screen.getByLabelText(/Descrição/), "Teste");
    await u.click(screen.getByRole("button", { name: "Registrar despesa" }));
    expect(await screen.findByText("Despesa registrada.")).not.toBeNull();
  });
  it("motorista não escolhe a origem da despesa", async () => {
    renderApp(<DespesaFormPage />, { como: MOT });
    await screen.findByRole("combobox", { name: "Categoria" });
    expect(screen.queryByText("Origem")).toBeNull();
  });
  it("resumo financeiro mostra as roscas", async () => {
    renderApp(<RelatoriosPage />, { como: ADM });
    expect(await screen.findByRole("img", { name: /Divisão do valor recebido/ })).not.toBeNull();
  });
  it("painel mostra aviso de aprovação pendente e próximos vencimentos", async () => {
    renderApp(<PainelPage />, { como: ADM });
    expect(await screen.findByText(/aguarda a sua aprovação/)).not.toBeNull();
    expect(screen.getByText("Próximos vencimentos")).not.toBeNull();
  });
});
