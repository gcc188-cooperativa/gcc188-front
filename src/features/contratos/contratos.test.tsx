import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ADM, MOT, renderApp } from "../../test/utils";
import { ContratoDetalhePage } from "./ContratoDetalhePage";
import { ContratoFormPage } from "./ContratoFormPage";

const detalhe = (como: number, id: number) =>
  renderApp(
    <Routes>
      <Route path="/contratos/:id" element={<ContratoDetalhePage />} />
    </Routes>,
    { como, rota: `/contratos/${id}` },
  );

describe("detalhe do contrato", () => {
  it("motorista não vê aprovar nem reprovar (CA-08)", async () => {
    detalhe(MOT, 155); // rascunho do próprio motorista
    expect(await screen.findByText("Contrato 0155")).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Aprovar" })).toBeNull();
    expect(screen.getByRole("button", { name: "Submeter à aprovação" })).not.toBeNull();
  });
  it("administrador aprova e o cronograma é gerado", async () => {
    detalhe(ADM, 152);
    const u = userEvent.setup();
    await u.click(await screen.findByRole("button", { name: "Aprovar" }));
    await u.click(await screen.findByRole("button", { name: "Confirmar" }));
    expect(await screen.findByText("Ativo")).not.toBeNull();
    expect(await screen.findAllByText("Previsto")).not.toBeNull();
  });
  it("cliente não vê a taxa (RN10)", async () => {
    detalhe(4, 148);
    expect(await screen.findByText("Contrato 0148")).not.toBeNull();
    expect(screen.queryByText(/Taxa:/)).toBeNull();
  });
});

describe("formulário de contrato", () => {
  it("mostra o erro 422 junto ao campo taxa_valor (CA-09)", async () => {
    renderApp(
      <Routes>
        <Route path="/contratos/:id/editar" element={<ContratoFormPage />} />
      </Routes>,
      { como: MOT, rota: "/contratos/155/editar" },
    );
    const u = userEvent.setup();
    await screen.findByDisplayValue("Transportes Alvorada", {}, { timeout: 5000 });
    const taxa = screen.getByLabelText(/Taxa \(%\)/);
    await u.clear(taxa);
    await u.type(taxa, "150");
    await u.click(screen.getByRole("button", { name: "Salvar rascunho" }));
    expect(await screen.findByText("A taxa não pode exceder o valor bruto.")).not.toBeNull();
  });
});
