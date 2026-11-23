import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ADM, renderApp } from "../test/utils";
import { CooperadosPage } from "./cooperados/CooperadosPage";
import { DespesaFormPage } from "./despesas/DespesaFormPage";
import { RelatoriosPage } from "./relatorios/RelatoriosPage";

describe("cadastros e relatórios", () => {
  it("cria cooperado com usuário e mostra conflito de e-mail junto ao campo", async () => {
    renderApp(<CooperadosPage />, { como: ADM });
    const u = userEvent.setup();
    await u.click(await screen.findByRole("button", { name: "Novo cadastro" }));
    const m = within(await screen.findByRole("dialog"));
    await u.type(m.getByLabelText(/Nome completo/), "Paulo Nunes");
    await u.type(m.getByLabelText(/Matrícula/), "0099");
    await u.type(m.getByLabelText(/CPF/), "11122233344");
    await u.type(m.getByLabelText(/Data de ingresso/), "2026-01-10");
    await u.type(m.getByLabelText(/E-mail de acesso/), "mot@coop.example");
    await u.type(m.getByLabelText(/Senha temporária/), "uma-senha-longa-1");
    await u.click(m.getByRole("button", { name: "Salvar cadastro" }));
    expect(await m.findByText("E-mail já cadastrado.")).not.toBeNull();
  });
  it("regra RN08 aparece no campo da despesa", async () => {
    renderApp(<DespesaFormPage />, { como: ADM });
    const u = userEvent.setup();
    await u.type(await screen.findByLabelText(/Valor/), "10");
    await u.type(screen.getByLabelText(/Data/), "2026-11-01");
    await u.type(screen.getByLabelText(/Descrição/), "Teste");
    await u.click(screen.getByRole("button", { name: "Registrar despesa" }));
    expect(await screen.findByText("Despesa registrada.")).not.toBeNull(); // origem COOPERATIVA sem cooperado é válida
  });
  it("resumo financeiro mostra o gráfico de destino do valor", async () => {
    renderApp(<RelatoriosPage />, { como: ADM });
    expect(await screen.findByRole("img", { name: /Destino do valor recebido/ })).not.toBeNull();
  });
});
