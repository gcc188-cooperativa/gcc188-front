import { useQuery } from "@tanstack/react-query";
import { api, ok } from "./client";

const rotulo = (v: { id: number; nome: string }, pre = "") => ({
  value: String(v.id),
  label: pre + v.nome,
});
/** Cooperados para seleção (somente ADM e FIN podem listar). */
export const useCooperados = (enabled: boolean) =>
  useQuery({
    queryKey: ["opt-coop"],
    enabled,
    queryFn: async () =>
      ok(await api.GET("/cooperados", { params: { query: { size: 100 } } })).content.map((c) =>
        rotulo(c, `${c.matricula} · `),
      ),
  });
export const useClientes = () =>
  useQuery({
    queryKey: ["opt-cli"],
    queryFn: async () =>
      ok(await api.GET("/clientes", { params: { query: { size: 100 } } })).content.map((c) =>
        rotulo(c),
      ),
  });
