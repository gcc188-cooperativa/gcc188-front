import { describe, expect, it } from "vitest";
import { numero, numeroOuNulo } from "./numero";

describe("conversão numérica segura (D39/RF-WEB-04)", () => {
  it("aceita decimal brasileiro e números finitos", () => {
    expect(numero("1200,50")).toBe(1200.5);
    expect(numero(" 42 ")).toBe(42);
    expect(numero(7)).toBe(7);
    expect(numeroOuNulo("7")).toBe(7);
    expect(numeroOuNulo(0)).toBe(0);
  });

  it("nunca produz NaN para campo vazio ou inválido", () => {
    expect(numero("")).toBe(0);
    expect(numero("   ")).toBe(0);
    expect(numero("abc")).toBe(0);
    expect(numero(undefined)).toBe(0);
    expect(numero(Number.NaN, 9)).toBe(9);
    expect(numero(Number.POSITIVE_INFINITY)).toBe(0);
    expect(Number.isNaN(numero("x"))).toBe(false);
  });

  it("devolve nulo para ids opcionais ausentes ou inválidos", () => {
    expect(numeroOuNulo("")).toBeNull();
    expect(numeroOuNulo("abc")).toBeNull();
    expect(numeroOuNulo(Number.NaN)).toBeNull();
  });
});
