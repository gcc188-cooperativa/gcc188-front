import { describe, expect, it } from "vitest";
import { acoesDisponiveis, type Papel, type Status } from "./index";

const STATUS: Status[] = ["RASCUNHO", "PENDENTE_APROVACAO", "ATIVO", "ENCERRADO", "CANCELADO"];
const ADM: Record<Status, string[]> = {
  RASCUNHO: ["editar", "submeter", "excluir", "cancelar"],
  PENDENTE_APROVACAO: ["aprovar", "reprovar", "cancelar"],
  ATIVO: ["encerrar", "cancelar"],
  ENCERRADO: [],
  CANCELADO: [],
};
const acoes = (status: Status, papel: Papel, autor = 99, usuario = 1) =>
  acoesDisponiveis({ status, criado_por_id: autor }, papel, usuario);

describe("acoesDisponiveis (RN12, CA-08)", () => {
  it.each(STATUS)("administrador em %s", (s) => expect(acoes(s, "ADMINISTRADOR")).toEqual(ADM[s]));
  it.each(STATUS)("financeiro e cliente nunca têm ações em %s", (s) => {
    expect(acoes(s, "FINANCEIRO")).toEqual([]);
    expect(acoes(s, "CLIENTE")).toEqual([]);
  });
  it("motorista não aprova nem reprova contrato pendente (CA-08)", () =>
    expect(acoes("PENDENTE_APROVACAO", "MOTORISTA")).toEqual([]));
  it("motorista edita, submete e exclui rascunho", () =>
    expect(acoes("RASCUNHO", "MOTORISTA")).toEqual(["editar", "submeter", "excluir"]));
  it("quem elaborou o contrato não o aprova", () =>
    expect(acoes("PENDENTE_APROVACAO", "ADMINISTRADOR", 1, 1)).toEqual(["reprovar", "cancelar"]));
});
