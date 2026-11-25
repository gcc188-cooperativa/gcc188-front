import { MantineProvider } from "@mantine/core";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { Data, Dinheiro, StatusBadge } from "./index";
import { msgErro } from "../api/client";

const r = (ui: React.ReactNode) => {
  const { container } = render(
    <MantineProvider>
      <div data-testid="alvo">{ui}</div>
    </MantineProvider>,
  );
  return { container: container.querySelector("[data-testid=alvo]") as HTMLElement };
};

describe("formatação pt-BR", () => {
  it("formata reais", () =>
    expect(r(<Dinheiro v={1200.5} />).container.textContent).toMatch(/R\$\s1\.200,50/));
  it("formata data sem deslocar o dia (D39)", () =>
    expect(r(<Data v="2026-12-01" />).container.textContent).toBe("01/12/2026"));
  it("mostra traço para data ausente", () =>
    expect(r(<Data v={null} />).container.textContent).toBe("—"));
});
describe("estado e erros", () => {
  it("rotula o status pendente", () =>
    expect(r(<StatusBadge s="PENDENTE_APROVACAO" />).container.textContent).toBe(
      "Pendente de aprovação",
    ));
  it("não tem violações de acessibilidade", async () => {
    const { container } = r(
      <main>
        <StatusBadge s="ATIVO" />
        <Dinheiro v={10} />
      </main>,
    );
    expect((await axe(container)).violations).toEqual([]);
  });
  it("junta campos inválidos na mensagem", () =>
    expect(
      msgErro({
        title: "x",
        status: 422,
        campos_invalidos: [{ campo: "taxa_valor", mensagem: "Taxa maior que a parcela" }],
      }),
    ).toBe("taxa_valor: Taxa maior que a parcela"));
});
