import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "../../test/utils";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { msgErro } from "../api/client";
import { Acoes } from "./acoes";
import { Data, Dinheiro, StatusBadge } from "./index";
import { Tabela } from "./tabela";

describe("formatação pt-BR", () => {
  it("formata reais", () => {
    render(<Dinheiro v={1200.5} />);
    expect(screen.getByText(/R\$\s1\.200,50/)).not.toBeNull();
  });
  it("formata data sem deslocar o dia (D39)", () => {
    render(<Data v="2026-12-01" />);
    expect(screen.getByText("01/12/2026")).not.toBeNull();
  });
  it("mostra traço para data ausente", () => {
    render(<Data v={null} />);
    expect(screen.getByText("—")).not.toBeNull();
  });
  it("não exibe NaN como valor monetário", () => {
    render(<Dinheiro v={Number.NaN} />);
    expect(screen.getByText(/R\$\s0,00/)).not.toBeNull();
  });
});
describe("componentes do protótipo", () => {
  it("rotula o status pendente", () => {
    render(<StatusBadge s="PENDENTE_APROVACAO" />);
    expect(screen.getByText("Pendente de aprovação")).not.toBeNull();
  });
  it("botão dividido executa a primeira ação e abre o menu com as demais", async () => {
    const u = userEvent.setup();
    let n = "";
    render(
      <Acoes
        acoes={[
          { rotulo: "A", fazer: () => (n += "a") },
          { rotulo: "B", perigo: true, fazer: () => (n += "b") },
        ]}
      />,
    );
    await u.click(screen.getByRole("button", { name: "A" }));
    await u.click(screen.getByRole("button", { name: "Escolher outra ação" }));
    await u.click(await screen.findByRole("menuitem", { name: "B" }));
    expect(n).toBe("ab");
  });
});
describe("tabela, acessibilidade e mensagens", () => {
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
