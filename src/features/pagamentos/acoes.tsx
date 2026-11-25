import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { api, msgErro } from "../../shared/api/client";
import { pode } from "../../shared/permissions";
import type { Acao } from "../../shared/ui/acoes";
import { confirmar } from "../../shared/ui/confirm";
import { toast } from "../../shared/ui/toast";
import { useSession } from "../auth/session";

/** Ações permitidas sobre um pagamento, conforme papel e situação (RN04, RN07, matriz de permissões). */
export function usePagamentoAcoes() {
  const papel = useSession().user!.papel,
    qc = useQueryClient();
  const hoje = () => dayjs().format("YYYY-MM-DD");
  const rodar = (titulo: string, fn: () => Promise<{ error?: unknown }>) => async () => {
    const r = await fn();
    if (r.error) return toast(msgErro(r.error), true);
    toast(`${titulo}: concluído.`);
    ["pagamentos", "contrato", "indicadores", "rel-resumo"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k] }),
    );
  };
  return (p: { id: number; status: string }): Acao[] => {
    const path = { path: { id: p.id } },
      a: Acao[] = [];
    if (pode.baixaRepasse(papel) && p.status === "PREVISTO")
      a.push({
        rotulo: "Registrar baixa",
        fazer: () =>
          confirmar({
            titulo: "Registrar baixa?",
            aoConfirmar: rodar("Registrar baixa", () =>
              api.POST("/pagamentos/{id}/baixa", { params: path, body: { data_baixa: hoje() } }),
            ),
          }),
      });
    if (pode.baixaRepasse(papel) && p.status === "PAGO")
      a.push({
        rotulo: "Registrar repasse",
        fazer: () =>
          confirmar({
            titulo: "Registrar repasse?",
            aoConfirmar: rodar("Registrar repasse", () =>
              api.POST("/pagamentos/{id}/repasse", {
                params: path,
                body: { data_repasse: hoje() },
              }),
            ),
          }),
      });
    if (pode.estorno(papel) && p.status === "PAGO")
      a.push({
        rotulo: "Estornar baixa",
        perigo: true,
        fazer: () =>
          confirmar({
            titulo: "Estornar baixa?",
            perigo: true,
            campo: { rotulo: "Justificativa" },
            aoConfirmar: (justificativa) =>
              rodar("Estornar baixa", () =>
                api.POST("/pagamentos/{id}/estorno", { params: path, body: { justificativa } }),
              )(),
          }),
      });
    return a;
  };
}
