import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CLI, FIN, renderApp } from "../../test/utils";
import { PagamentosPage } from "./PagamentosPage";

describe("pagamentos", () => {
  it("financeiro registra a baixa", async () => {
    renderApp(<PagamentosPage />, { como: FIN });
    const u = userEvent.setup();
    await u.click((await screen.findAllByRole("button", { name: "Registrar baixa" }))[0]);
    await u.click(await screen.findByRole("button", { name: "Confirmar" }));
    expect(await screen.findByText("Registrar baixa: concluído.")).not.toBeNull();
  });
  it("cliente só consulta (RF-WEB-11)", async () => {
    renderApp(<PagamentosPage />, { como: CLI });
    await screen.findAllByText("0148");
    expect(screen.queryByRole("button", { name: /Registrar|Estornar/ })).toBeNull();
    expect(screen.queryByText("Líquido")).toBeNull();
  });
  it("destaca pagamento em atraso (P5)", async () => {
    renderApp(<PagamentosPage />, { como: FIN });
    expect(await screen.findByText("Em atraso")).not.toBeNull();
  });
});
