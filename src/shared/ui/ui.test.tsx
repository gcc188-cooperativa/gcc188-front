import { render as rtlRender } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { TemaProvider } from "../../app/Providers";
import { msgErro } from "../api/client";
import { Acoes } from "./acoes";
import { Data, Dinheiro, StatusBadge } from "./index";
import { Tabela } from "./tabela";

/** O provedor do Mantine injeta <style>; por isso o texto é lido de um contêiner próprio. */
function render(ui: React.ReactNode) {
  const r = rtlRender(
    <TemaProvider>
      <div data-testid="alvo">{ui}</div>
    </TemaProvider>,
  );
  return { ...r, container: r.getByTestId("alvo") };
}

describe("formatação pt-BR", () => {
  it("formata reais", () =>
    expect(render(<Dinheiro v={1200.5} />).container.textContent).toMatch(/R\$\s1\.200,50/));
  it("formata data sem deslocar o dia (D39)", () =>
    expect(render(<Data v="2026-12-01" />).container.textContent).toBe("01/12/2026"));
  it("mostra traço para data ausente", () =>
    expect(render(<Data v={null} />).container.textContent).toBe("—"));
});
describe("componentes do protótipo", () => {
  it("rotula o status pendente", () =>
    expect(render(<StatusBadge s="PENDENTE_APROVACAO" />).container.textContent).toBe(
      "Pendente de aprovação",
    ));
  it("tabela ordena em ordem crescente e decrescente", async () => {
    const u = userEvent.setup();
    const { container } = render(
      <Tabela
        rows={[{ n: "b" }, { n: "a" }, { n: "c" }]}
        k={(r) => r.n}
        cols={[{ t: "Nome", r: (r) => r.n, o: (r) => r.n }]}
      />,
    );
    const ordem = () =>
      Array.from(container.querySelectorAll("tbody td"))
        .map((x) => x.textContent)
        .join("");
    await u.click(container.querySelector("th button")!);
    expect(ordem()).toBe("abc");
    await u.click(container.querySelector("th button")!);
    expect(ordem()).toBe("cba");
  });
  it("botão dividido executa a primeira ação e abre o menu com as demais", async () => {
    const u = userEvent.setup();
    let n = "";
    const { getByRole, findByRole } = render(
      <Acoes
        acoes={[
          { rotulo: "A", fazer: () => (n += "a") },
          { rotulo: "B", perigo: true, fazer: () => (n += "b") },
        ]}
      />,
    );
    await u.click(getByRole("button", { name: "A" }));
    await u.click(getByRole("button", { name: "Escolher outra ação" }));
    await u.click(await findByRole("menuitem", { name: "B" }));
    expect(n).toBe("ab");
  });
  it("não tem violações de acessibilidade", async () => {
    const { container } = render(
      <main>
        <StatusBadge s="ATIVO" />
        <Dinheiro v={10} />
        <Tabela
          rows={[{ n: "a" }]}
          k={(r) => r.n}
          cols={[{ t: "Nome", r: (r) => r.n, o: (r) => r.n }]}
        />
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
