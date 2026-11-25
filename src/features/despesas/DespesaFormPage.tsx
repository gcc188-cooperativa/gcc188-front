import { useForm, type UseFormReturnType } from "@mantine/form";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ok, type Schemas } from "../../shared/api/client";
import { useCooperados } from "../../shared/api/opcoes";
import { CATEGORIA, Cartao, PageHeader } from "../../shared/ui";
import { Campo, Seg, aplicarErros } from "../../shared/ui/form";
import { Icone } from "../../shared/ui/icons";
import { numero, numeroOuNulo } from "../../shared/ui/numero";
import { toast } from "../../shared/ui/toast";
import { useSession } from "../auth/session";

const VAZIO = {
  origem: "COOPERATIVA",
  categoria: "COMBUSTIVEL",
  descricao: "",
  valor: "",
  data_despesa: "",
  cooperado_id: "",
  contrato_id: "",
};
type V = typeof VAZIO;
type Form = UseFormReturnType<V>;
type Op = { value: string; label: string };

const ORIGENS: Op[] = [
  { value: "COOPERATIVA", label: "Cooperativa" },
  { value: "COOPERADO", label: "Cooperado" },
];
const CATEGORIAS: Op[] = Object.entries(CATEGORIA).map(([value, label]) => ({ value, label }));

function useSalvarDespesa({
  form,
  id,
  atual,
  coopId,
}: {
  form: Form;
  id: number | null;
  atual: Schemas["Despesa"] | undefined;
  coopId: number | null;
}) {
  const nav = useNavigate();
  return async (v: V) => {
    const coop = v.origem === "COOPERADO";
    const body = {
      origem: v.origem as "COOPERADO",
      categoria: v.categoria as "OUTROS",
      descricao: v.descricao,
      valor: numero(v.valor),
      data_despesa: v.data_despesa,
      cooperado_id: coop ? coopId : null,
      contrato_id: coop ? numeroOuNulo(v.contrato_id) : null,
    };
    const r = id
      ? await api.PUT("/despesas/{id}", {
          params: { path: { id } },
          body: { ...body, versao: atual!.versao },
        })
      : await api.POST("/despesas", { body });
    if (r.error) return aplicarErros(form, r.error);
    toast("Despesa registrada.");
    nav("/despesas");
  };
}

function useDespesaFormulario() {
  const id = numeroOuNulo(useParams().id);
  const { user } = useSession();
  const mot = user!.papel === "MOTORISTA";
  const form = useForm<V>({
    initialValues: { ...VAZIO, origem: mot ? "COOPERADO" : "COOPERATIVA" },
  });
  const coops = useCooperados(!mot);
  const coopId = mot ? user!.vinculo_id : numeroOuNulo(form.values.cooperado_id);
  const { data: atual } = useQuery({
    queryKey: ["despesa", id],
    enabled: !!id,
    queryFn: async () => ok(await api.GET("/despesas/{id}", { params: { path: { id: id! } } })),
  });
  const { data: contratos } = useQuery({
    queryKey: ["opt-contratos", coopId],
    enabled: form.values.origem === "COOPERADO" && !!coopId,
    queryFn: async () =>
      ok(
        await api.GET("/contratos", {
          params: { query: { size: 100, cooperado_id: coopId! } },
        }),
      ).content.map((c) => ({ value: String(c.id), label: String(c.id).padStart(4, "0") })),
  });
  useEffect(() => {
    if (atual)
      form.setValues({
        ...VAZIO,
        origem: atual.origem,
        categoria: atual.categoria,
        descricao: atual.descricao,
        valor: String(atual.valor),
        data_despesa: atual.data_despesa,
        cooperado_id: atual.cooperado_id ? String(atual.cooperado_id) : "",
        contrato_id: atual.contrato_id ? String(atual.contrato_id) : "",
      });
  }, [atual]); // eslint-disable-line react-hooks/exhaustive-deps
  const salvar = useSalvarDespesa({ form, id, atual, coopId });
  return {
    id,
    mot,
    nome: user!.nome,
    form,
    coops,
    contratos,
    salvar,
    coop: form.values.origem === "COOPERADO",
  };
}

function CampoOrigem({ form, mot }: { form: Form; mot: boolean }) {
  return !mot && <Seg form={form} name="origem" label="Origem" opcoes={ORIGENS} />;
}

function CamposCooperado({
  form,
  mot,
  nome,
  coops,
  contratos,
}: {
  form: Form;
  mot: boolean;
  nome: string;
  coops: Op[];
  contratos: Op[];
}) {
  return (
    <div className="two">
      {mot ? (
        <div className="fd">
          <label htmlFor="coop">Cooperado</label>
          <select id="coop" disabled>
            <option>{nome}</option>
          </select>
        </div>
      ) : (
        <Campo form={form} name="cooperado_id" label="Cooperado" opcoes={coops} vazio="Selecione" />
      )}
      <Campo
        form={form}
        name="contrato_id"
        label="Contrato (opcional)"
        opcoes={contratos}
        vazio="Nenhum"
        hint="Só contratos do cooperado."
      />
    </div>
  );
}

function CamposDespesa({ form }: { form: Form }) {
  return (
    <>
      <div className="two">
        <Campo form={form} name="categoria" label="Categoria" opcoes={CATEGORIAS} />
        <Campo form={form} name="data_despesa" label="Data" type="date" />
      </div>
      <Campo form={form} name="descricao" label="Descrição" />
      <Campo form={form} name="valor" label="Valor (R$)" type="number" placeholder="0,00" />
    </>
  );
}

export function DespesaFormPage() {
  const { id, mot, nome, form, coops, contratos, salvar, coop } = useDespesaFormulario();
  return (
    <>
      <PageHeader title={id ? "Editar despesa" : "Nova despesa"} />
      <form noValidate onSubmit={form.onSubmit(salvar)}>
        <Cartao>
          <CampoOrigem form={form} mot={mot} />
          {coop && (
            <CamposCooperado
              form={form}
              mot={mot}
              nome={nome}
              coops={coops.data ?? []}
              contratos={contratos ?? []}
            />
          )}
          <CamposDespesa form={form} />
        </Cartao>
        <div className="acts lg">
          <Link className="bt" to="/despesas">
            Cancelar
          </Link>
          <button className="bt pri" type="submit">
            <Icone n="check" />
            Registrar despesa
          </button>
        </div>
      </form>
    </>
  );
}
