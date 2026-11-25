import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { describe, expect, it } from "vitest";
import { Donut } from "./charts";

describe("Donut", () => {
  it("descreve valores no rótulo, mostra percentuais e passa no axe", async () => {
    const { container } = render(
      <main>
        <Donut
          titulo="Teste"
          centro="30%"
          sub="é A"
          fatias={[
            { nome: "A", valor: 30, cor: "red" },
            { nome: "B", valor: 70, cor: "blue" },
          ]}
        />
      </main>,
    );
    expect(screen.getByRole("img", { name: "Teste: A 30, B 70" })).not.toBeNull();
    expect(screen.getByText("70%")).not.toBeNull();
    expect((await axe(container)).violations).toEqual([]);
  });
});
