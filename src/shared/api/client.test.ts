import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { server } from "../../mocks/server";
import { api } from "./client";

const B = "*/api/v1";
describe("cliente HTTP (CA-10)", () => {
  it("renova uma vez em 401 e repete a chamada", async () => {
    sessionStorage.setItem("mock-user", "2");
    let n = 0,
      renovou = 0;
    server.use(
      http.get(`${B}/painel/indicadores`, () =>
        n++ === 0
          ? HttpResponse.json({ title: "Expirado", status: 401 }, { status: 401 })
          : HttpResponse.json({ contratos_ativos: 3 }),
      ),
      http.post(`${B}/auth/refresh`, () => {
        renovou++;
        return HttpResponse.json({});
      }),
    );
    const r = await api.GET("/painel/indicadores");
    expect(r.data?.contratos_ativos).toBe(3);
    expect(renovou).toBe(1);
  });
  it("avisa a interface quando a renovação falha", async () => {
    const ouvinte = vi.fn();
    addEventListener("sessao-expirada", ouvinte);
    const r = await api.GET("/painel/indicadores"); // sem sessão: 401 e refresh 401
    expect(r.response.status).toBe(401);
    expect(ouvinte).toHaveBeenCalled();
    removeEventListener("sessao-expirada", ouvinte);
  });
});
