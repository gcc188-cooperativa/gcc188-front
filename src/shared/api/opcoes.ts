import { useQuery } from "@tanstack/react-query";
import { useSession } from "../../features/auth/session";
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
export const useClientes = (enabled = true) =>
  useQuery({
    queryKey: ["opt-cli"],
    enabled,
    queryFn: async () =>
      ok(await api.GET("/clientes", { params: { query: { size: 100 } } })).content.map((c) =>
        rotulo(c),
      ),
  });

/** Nomes de cliente e cooperado a partir do id, com o que cada papel pode consultar (RN10). */
export function useNomes() {
  const { user } = useSession();
  const papel = user!.papel;
  const cli = useClientes(papel !== "CLIENTE"),
    coop = useCooperados(papel === "ADMINISTRADOR" || papel === "FINANCEIRO");
  const achar = (d: { value: string; label: string }[] | undefined, id: number) =>
    d?.find((o) => o.value === String(id))?.label;
  return {
    cliente: (id: number) =>
      achar(cli.data, id) ??
      (papel === "CLIENTE" && id === user!.vinculo_id ? user!.nome : `#${id}`),
    cooperado: (id: number) =>
      achar(coop.data, id)?.replace(/^.*? · /, "") ??
      (papel === "MOTORISTA" && id === user!.vinculo_id ? user!.nome : `#${id}`),
  };
}
