import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { api, msgErro } from "../../shared/api/client";
import { acoesDisponiveis, type AcaoContrato, type Status } from "../../shared/permissions";
import type { Acao } from "../../shared/ui/acoes";
import { confirmar } from "../../shared/ui/confirm";
import { toast } from "../../shared/ui/toast";
import { useSession } from "../auth/session";

const ROTULO: Record<AcaoContrato, string> = {
  editar: "Editar",
  submeter: "Submeter à aprovação",
  excluir: "Excluir rascunho",
  aprovar: "Aprovar contrato",
  reprovar: "Reprovar contrato",
  encerrar: "Encerrar contrato",
  cancelar: "Cancelar contrato",
};
const PERIGO: AcaoContrato[] = ["excluir", "cancelar"],
  CONFIRMA: AcaoContrato[] = ["excluir", "cancelar", "encerrar", "aprovar"];

/** Ações de transição do contrato (RN12) com confirmação; a lista e o detalhe usam o mesmo hook. */
export function useContratoAcoes() {
  const { user } = useSession(),
    qc = useQueryClient(),
    nav = useNavigate(),
    { pathname } = useLocation();
  async function executar(id: number, a: AcaoContrato, texto = "") {
    const p = { path: { id } };
    const r =
      a === "excluir"
        ? await api.DELETE("/contratos/{id}", { params: p })
        : a === "reprovar"
          ? await api.POST("/contratos/{id}/reprovacao", { params: p, body: { motivo: texto } })
          : await api.POST(
              `/contratos/{id}/${{ submeter: "submissao", aprovar: "aprovacao", encerrar: "encerramento", cancelar: "cancelamento", editar: "submissao" }[a]}` as "/contratos/{id}/aprovacao",
              { params: p },
            );
    ["contrato", "contratos", "pagamentos", "indicadores"].forEach((k) =>
      qc.invalidateQueries({ queryKey: [k] }),
    );
    if (r.error) return toast(msgErro(r.error), true);
    toast(`${ROTULO[a]}: concluído.`);
    if (a === "excluir" && pathname !== "/contratos") nav("/contratos");
  }
  const pedir = (id: number, a: AcaoContrato) => {
    if (a === "editar") return nav(`/contratos/${id}/editar`);
    if (a === "reprovar")
      return confirmar({
        titulo: "Reprovar contrato?",
        mensagem: "Informe o motivo; o contrato volta a rascunho.",
        campo: { rotulo: "Motivo da reprovação" },
        aoConfirmar: (t) => executar(id, a, t),
      });
    if (CONFIRMA.includes(a))
      return confirmar({
        titulo: `${ROTULO[a]}?`,
        perigo: PERIGO.includes(a),
        aoConfirmar: () => executar(id, a),
      });
    return executar(id, a);
  };
  return (c: { id: number; status: Status; criado_por_id: number }): Acao[] =>
    acoesDisponiveis(c, user!.papel, user!.usuario_id).map((a) => ({
      rotulo: ROTULO[a],
      perigo: PERIGO.includes(a),
      fazer: () => pedir(c.id, a),
    }));
}
