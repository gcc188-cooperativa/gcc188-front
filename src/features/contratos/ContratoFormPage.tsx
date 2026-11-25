import { Button, NativeSelect } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ok } from "../../shared/api/client";
import { useClientes, useCooperados } from "../../shared/api/opcoes";
import { Cartao, Nota, PageHeader, reais } from "../../shared/ui";
import { Campo, aplicarErros } from "../../shared/ui/form";
import { Icone } from "../../shared/ui/icons";
import { toast } from "../../shared/ui/toast";
import { useSession } from "../auth/session";

const VAZIO = {
  cooperado_id: "",
  cliente_id: "",
  descricao: "",
  valor_total: "6000",
  modalidade: "MENSAL",
  num_parcelas: "3",
  dia_vencimento: "12",
  data_inicio: "",
  data_fim: "",
  taxa_tipo: "PERCENTUAL",
  taxa_valor: "10",
};
type V = typeof VAZIO;

/** Prévia indicativa por parcela (como no protótipo); a API é quem calcula e valida (RN02, RN03). */
function previa(v: V) {
  const n = v.modalidade === "UNICO" ? 1 : Math.max(2, Number(v.num_parcelas) || 2),
    b = (Number(v.valor_total) || 0) / n,
    t = Number(v.taxa_valor) || 0;
  const x = Math.round((v.taxa_tipo === "PERCENTUAL" ? (b * t) / 100 : t) * 100) / 100;
  const erro =
    v.taxa_tipo === "PERCENTUAL" && t > 100
      ? "O percentual não pode passar de 100."
      : t <= 0
        ? "Informe uma taxa maior que zero."
        : x > b
          ? `A taxa não pode ser maior que o valor da parcela (${reais(b)}).`
          : "";
  return { b, x, l: b - x, erro };
}

export function ContratoFormPage() {
  const id = Number(useParams().id) || null,
    nav = useNavigate(),
    { user } = useSession(),
    mot = user!.papel === "MOTORISTA";
  const form = useForm({ initialValues: VAZIO });
  const coops = useCooperados(!mot),
    clientes = useClientes();
  const { data: atual } = useQuery({
    queryKey: ["contrato", id],
    enabled: !!id,
    queryFn: async () => ok(await api.GET("/contratos/{id}", { params: { path: { id: id! } } })),
  });
  useEffect(() => {
    if (atual)
      form.setValues({
        ...VAZIO,
        descricao: atual.descricao,
        modalidade: atual.modalidade,
        taxa_tipo: atual.taxa_tipo,
        data_inicio: atual.data_inicio,
        data_fim: atual.data_fim ?? "",
        cooperado_id: String(atual.cooperado_id),
        cliente_id: String(atual.cliente_id),
        valor_total: String(atual.valor_total),
        num_parcelas: String(atual.num_parcelas),
        dia_vencimento: String(atual.dia_vencimento ?? ""),
        taxa_valor: String(atual.taxa_valor),
      });
  }, [atual]); // eslint-disable-line react-hooks/exhaustive-deps

  async function salvar(v: V, submeter: boolean) {
    const mensal = v.modalidade === "MENSAL";
    const body = {
      cooperado_id: mot ? user!.vinculo_id! : Number(v.cooperado_id),
      cliente_id: Number(v.cliente_id),
      descricao: v.descricao,
      valor_total: Number(v.valor_total),
      modalidade: v.modalidade as "MENSAL",
      num_parcelas: mensal ? Number(v.num_parcelas) : 1,
      dia_vencimento: mensal ? Number(v.dia_vencimento) : null,
      data_inicio: v.data_inicio,
      data_fim: v.data_fim || null,
      taxa_tipo: v.taxa_tipo as "FIXO",
      taxa_valor: Number(v.taxa_valor),
    };
    const r = id
      ? await api.PUT("/contratos/{id}", {
          params: { path: { id } },
          body: { ...body, versao: atual!.versao },
        })
      : await api.POST("/contratos", { body });
    if (r.error) return aplicarErros(form, r.error); // 422 junto ao campo, ex.: taxa_valor (CA-09)
    if (submeter) {
      const s = await api.POST("/contratos/{id}/submissao", {
        params: { path: { id: r.data!.id } },
      });
      if (s.error) return aplicarErros(form, s.error);
    }
    toast(submeter ? "Contrato enviado para aprovação." : "Rascunho salvo.");
    nav(`/contratos/${r.data!.id}`);
  }
  const enviar = (submeter: boolean) => form.onSubmit((v) => salvar(v, submeter));
  const v = form.values,
    pv = previa(v),
    mensal = v.modalidade === "MENSAL";
  return (
    <>
      <PageHeader
        title={id ? "Editar contrato" : "Novo contrato"}
        sub="Fica em rascunho até você submeter à aprovação."
      />
      <form noValidate onSubmit={enviar(false)}>
        <Cartao t="Partes e serviço">
          <div className="two">
            <Campo
              form={form}
              name="cliente_id"
              label="Cliente"
              opcoes={clientes.data ?? []}
              vazio="Selecione"
            />
            {mot ? (
              <div className="fd">
                <label htmlFor="coop">Cooperado</label>
                <NativeSelect id="coop" disabled>
                  <option>{user!.nome}</option>
                </NativeSelect>
              </div>
            ) : (
              <Campo
                form={form}
                name="cooperado_id"
                label="Cooperado"
                opcoes={coops.data ?? []}
                vazio="Selecione"
              />
            )}
          </div>
          <Campo
            form={form}
            name="descricao"
            label="Descrição do serviço"
            placeholder="Ex.: transporte de insumos, rota Lavras–BH"
          />
        </Cartao>
        <Cartao t="Pagamento">
          <div className="two">
            <Campo form={form} name="valor_total" label="Valor total (R$)" type="number" />
            <Campo form={form} name="data_inicio" label="Início" type="date" />
          </div>
          <div className="two">
            <Campo
              form={form}
              name="modalidade"
              label="Modalidade"
              opcoes={[
                { value: "MENSAL", label: "Mensal" },
                { value: "UNICO", label: "Pagamento único" },
              ]}
            />
            {mensal && (
              <div className="two" style={{ gap: 8 }}>
                <Campo form={form} name="num_parcelas" label="Parcelas" type="number" min={2} />
                <Campo
                  form={form}
                  name="dia_vencimento"
                  label="Dia do vencimento"
                  type="number"
                  min={1}
                  max={28}
                  hint="De 1 a 28."
                />
              </div>
            )}
          </div>
          <Campo form={form} name="data_fim" label="Fim da vigência (opcional)" type="date" />
        </Cartao>
        <Cartao t="Taxa da cooperativa">
          <div className="two">
            <Campo
              form={form}
              name="taxa_tipo"
              label="Tipo"
              opcoes={[
                { value: "PERCENTUAL", label: "Percentual" },
                { value: "FIXO", label: "Valor fixo por parcela" },
              ]}
            />
            <Campo
              form={form}
              name="taxa_valor"
              label="Valor da taxa"
              type="number"
              extra={
                pv.erro && (
                  <div className="msg">
                    <Icone n="alert" />
                    <span>{pv.erro}</span>
                  </div>
                )
              }
            />
          </div>
          <Nota>
            <b>Prévia por parcela (estimativa):</b> bruto{" "}
            <span className="b num">{reais(pv.b)}</span> · taxa{" "}
            <span className="t num">{reais(pv.x)}</span> · líquido{" "}
            <span className="l num">{reais(pv.l)}</span>
          </Nota>
        </Cartao>
        <div className="acts lg">
          <Button component={Link} variant="default" className="bt" to="/contratos">
            Cancelar
          </Button>
          <Button variant="default" className="bt" type="submit">
            Salvar rascunho
          </Button>
          <Button variant="default" className="bt pri" type="button" onClick={() => enviar(true)()}>
            <Icone n="check" />
            Salvar e submeter
          </Button>
        </div>
      </form>
    </>
  );
}
