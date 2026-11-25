import { useForm, type UseFormReturnType } from "@mantine/form";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Link, useNavigate, useParams, type NavigateFunction } from "react-router-dom";
import { api, ok, type Schemas } from "../../shared/api/client";
import { useClientes, useCooperados } from "../../shared/api/opcoes";
import { Cartao, Nota, PageHeader, reais } from "../../shared/ui";
import { Campo, aplicarErros, type Op } from "../../shared/ui/form";
import { Icone } from "../../shared/ui/icons";
import { numero, numeroOuNulo } from "../../shared/ui/numero";
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
type Form = UseFormReturnType<V>;

/** Prévia indicativa por parcela (como no protótipo); a API é quem calcula e valida (RN02, RN03). */
function previa(v: V) {
  const n = v.modalidade === "UNICO" ? 1 : Math.max(2, numero(v.num_parcelas, 2)),
    b = numero(v.valor_total) / n,
    t = numero(v.taxa_valor);
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

type SalvarCtx = {
  id: number | null;
  form: Form;
  mot: boolean;
  user: Schemas["SessaoUsuario"];
  atual: Schemas["ContratoDetalhe"] | undefined;
  nav: NavigateFunction;
};

async function salvar(v: V, submeter: boolean, ctx: SalvarCtx) {
  const mensal = v.modalidade === "MENSAL";
  const body = {
    cooperado_id: ctx.mot ? ctx.user!.vinculo_id! : numero(v.cooperado_id),
    cliente_id: numero(v.cliente_id),
    descricao: v.descricao,
    valor_total: numero(v.valor_total),
    modalidade: v.modalidade as "MENSAL",
    num_parcelas: mensal ? numero(v.num_parcelas, 2) : 1,
    dia_vencimento: mensal ? numeroOuNulo(v.dia_vencimento) : null,
    data_inicio: v.data_inicio,
    data_fim: v.data_fim || null,
    taxa_tipo: v.taxa_tipo as "FIXO",
    taxa_valor: numero(v.taxa_valor),
  };
  const r = ctx.id
    ? await api.PUT("/contratos/{id}", {
        params: { path: { id: ctx.id } },
        body: { ...body, versao: ctx.atual!.versao },
      })
    : await api.POST("/contratos", { body });
  if (r.error) return aplicarErros(ctx.form, r.error); // 422 junto ao campo, ex.: taxa_valor (CA-09)
  if (submeter) {
    const s = await api.POST("/contratos/{id}/submissao", {
      params: { path: { id: r.data!.id } },
    });
    if (s.error) return aplicarErros(ctx.form, s.error);
  }
  toast(submeter ? "Contrato enviado para aprovação." : "Rascunho salvo.");
  ctx.nav(`/contratos/${r.data!.id}`);
}

function useContratoAtual(id: number | null, form: Form) {
  const { data: atual } = useQuery({
    queryKey: ["contrato", id],
    enabled: !!id,
    queryFn: async () => ok(await api.GET("/contratos/{id}", { params: { path: { id: id! } } })),
  });
  const formRef = useRef(form);
  formRef.current = form;
  useEffect(() => {
    if (atual)
      formRef.current.setValues({
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
  }, [atual]);
  return atual;
}

function useContratoForm() {
  const id = numeroOuNulo(useParams().id),
    nav = useNavigate(),
    { user } = useSession(),
    mot = user!.papel === "MOTORISTA";
  const form = useForm({ initialValues: VAZIO });
  const coops = useCooperados(!mot),
    clientes = useClientes();
  const atual = useContratoAtual(id, form);
  const ctx: SalvarCtx = { id, form, mot, user: user!, atual, nav };
  const enviar = (submeter: boolean) => form.onSubmit((v) => salvar(v, submeter, ctx));
  const v = form.values,
    pv = previa(v),
    mensal = v.modalidade === "MENSAL";
  return { id, form, mot, nome: user!.nome, coops, clientes, pv, mensal, enviar };
}

function Partes({
  form,
  mot,
  nome,
  clientes,
  coops,
}: {
  form: Form;
  mot: boolean;
  nome: string;
  clientes: Op[];
  coops: Op[];
}) {
  return (
    <Cartao t="Partes e serviço">
      <div className="two">
        <Campo form={form} name="cliente_id" label="Cliente" opcoes={clientes} vazio="Selecione" />
        {mot ? (
          <div className="fd">
            <label htmlFor="coop">Cooperado</label>
            <select id="coop" disabled>
              <option>{nome}</option>
            </select>
          </div>
        ) : (
          <Campo
            form={form}
            name="cooperado_id"
            label="Cooperado"
            opcoes={coops}
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
  );
}

function Pagamento({ form, mensal }: { form: Form; mensal: boolean }) {
  return (
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
  );
}

function Taxa({ form, pv }: { form: Form; pv: ReturnType<typeof previa> }) {
  return (
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
        <b>Prévia por parcela (estimativa):</b> bruto <span className="b num">{reais(pv.b)}</span> ·
        taxa <span className="t num">{reais(pv.x)}</span> · líquido{" "}
        <span className="l num">{reais(pv.l)}</span>
      </Nota>
    </Cartao>
  );
}

export function ContratoFormPage() {
  const { form, id, mot, nome, coops, clientes, pv, mensal, enviar } = useContratoForm();
  return (
    <>
      <PageHeader
        title={id ? "Editar contrato" : "Novo contrato"}
        sub="Fica em rascunho até você submeter à aprovação."
      />
      <form noValidate onSubmit={enviar(false)}>
        <Partes
          form={form}
          mot={mot}
          nome={nome}
          clientes={clientes.data ?? []}
          coops={coops.data ?? []}
        />
        <Pagamento form={form} mensal={mensal} />
        <Taxa form={form} pv={pv} />
        <div className="acts lg">
          <Link className="bt" to="/contratos">
            Cancelar
          </Link>
          <button className="bt" type="submit">
            Salvar rascunho
          </button>
          <button className="bt pri" type="button" onClick={() => enviar(true)()}>
            <Icone n="check" />
            Salvar e submeter
          </button>
        </div>
      </form>
    </>
  );
}
