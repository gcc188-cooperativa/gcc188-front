import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ADM, CLI, MOT, renderApp } from "../../test/utils";
import { ContratoDetalhePage } from "./ContratoDetalhePage";
import { ContratoFormPage } from "./ContratoFormPage";
import { ContratosPage } from "./ContratosPage";

const detalhe = (como: number, id: number) =>
  renderApp(
    <Routes>
      <Route path="/contratos/:id" element={<ContratoDetalhePage />} />
    </Routes>,
    { como, rota: `/contratos/${id}` },
  );

describe("lista de contratos", () => {
  it("mostra nomes, taxa e ações em botão dividido; ordena pela coluna", async () => {
    renderApp(<ContratosPage />, { como: ADM });
    expect((await screen.findAllByText("Transportes Alvorada")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("10%").length).toBeGreaterThan(0);
    const u = userEvent.setup();
    await u.click(screen.getByRole("button", { name: /Valor total/ }));
    expect(
      screen.getByRole("columnheader", { name: /Valor total/ }).getAttribute("aria-sort"),
    ).toBe("ascending");
  });
  it("cliente não vê a coluna de taxa (RN10)", async () => {
    renderApp(<ContratosPage />, { como: CLI });
    await screen.findAllByText("0148");
    expect(screen.queryByRole("columnheader", { name: /Taxa/ })).toBeNull();
  });
});
describe("detalhe do contrato", () => {
  it("motorista não vê aprovar nem reprovar (CA-08)", async () => {
    const u = userEvent.setup();
    detalhe(MOT, 155);
    expect(await screen.findByText("Contrato 0155")).not.toBeNull();
    expect(screen.queryByText("Aprovar contrato")).toBeNull();
    expect(screen.getByRole("button", { name: "Editar" })).not.toBeNull();
    await u.click(await screen.findByRole("button", { name: "Escolher outra ação" }));
    expect(await screen.findByRole("menuitem", { name: "Submeter à aprovação" })).not.toBeNull(); // dentro do menu Mantine
  });
  it("administrador aprova e o cronograma é gerado", async () => {
    detalhe(ADM, 152);
    const u = userEvent.setup();
    await u.click(await screen.findByRole("button", { name: "Aprovar contrato" }));
    await u.click(await screen.findByRole("button", { name: "Confirmar" }));
    expect(await screen.findByText("Ativo")).not.toBeNull();
    expect((await screen.findAllByText("Previsto")).length).toBeGreaterThan(0);
  });
  it("reprovar exige motivo", async () => {
    detalhe(ADM, 152);
    const u = userEvent.setup();
    await u.click(await screen.findByRole("button", { name: "Escolher outra ação" }));
    await u.click(await screen.findByRole("menuitem", { name: "Reprovar contrato" }));
    expect(
      ((await screen.findByRole("button", { name: "Confirmar" })) as HTMLButtonElement).disabled,
    ).toBe(true);
    await u.type(screen.getByLabelText("Motivo da reprovação"), "Taxa divergente");
    await u.click(screen.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByText("Reprovar contrato: concluído.")).not.toBeNull();
  });
  it("cliente não vê a taxa (RN10)", async () => {
    detalhe(CLI, 148);
    expect(await screen.findByText("Contrato 0148")).not.toBeNull();
    expect(screen.queryByText(/Taxa \(/)).toBeNull();
  });
});
describe("formulário de contrato", () => {
  it("mostra o erro 422 junto ao campo da taxa (CA-09)", async () => {
    renderApp(
      <Routes>
        <Route path="/contratos/:id/editar" element={<ContratoFormPage />} />
      </Routes>,
      { como: MOT, rota: "/contratos/155/editar" },
    );
    const u = userEvent.setup();
    await screen.findByDisplayValue("Transportes Alvorada");
    const taxa = screen.getByLabelText("Valor da taxa");
    await u.clear(taxa);
    await u.type(taxa, "150");
    await u.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    expect(await screen.findByText("A taxa não pode exceder o valor bruto.")).not.toBeNull();
    expect(screen.getByText("O percentual não pode passar de 100.")).not.toBeNull(); // dica local
  });
});
