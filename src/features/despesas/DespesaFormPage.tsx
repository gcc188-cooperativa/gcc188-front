import { Button, NativeSelect } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ok } from "../../shared/api/client";
import { useCooperados } from "../../shared/api/opcoes";
import { CATEGORIA, Cartao, PageHeader } from "../../shared/ui";
import { Campo, Seg, aplicarErros } from "../../shared/ui/form";
import { Icone } from "../../shared/ui/icons";
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

export function DespesaFormPage() {
  const id = Number(useParams().id) || null,
    nav = useNavigate(),
    { user } = useSession(),
    mot = user!.papel === "MOTORISTA";
  const form = useForm({ initialValues: { ...VAZIO, origem: mot ? "COOPERADO" : "COOPERATIVA" } });
  const coops = useCooperados(!mot);
  const coopId = mot ? user!.vinculo_id : Number(form.values.cooperado_id) || null;
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
        await api.GET("/contratos", { params: { query: { size: 100, cooperado_id: coopId! } } }),
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

  async function salvar(v: typeof VAZIO) {
    const coop = v.origem === "COOPERADO";
    const body = {
      origem: v.origem as "COOPERADO",
      categoria: v.categoria as "OUTROS",
      descricao: v.descricao,
      valor: Number(v.valor),
      data_despesa: v.data_despesa,
      cooperado_id: coop ? coopId : null,
      contrato_id: coop && v.contrato_id ? Number(v.contrato_id) : null,
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
  }
  const coop = form.values.origem === "COOPERADO";
  return (
    <>
      <PageHeader title={id ? "Editar despesa" : "Nova despesa"} />
      <form noValidate onSubmit={form.onSubmit(salvar)}>
        <Cartao>
          {!mot && (
            <Seg
              form={form}
              name="origem"
              label="Origem"
              opcoes={[
                { value: "COOPERATIVA", label: "Cooperativa" },
                { value: "COOPERADO", label: "Cooperado" },
              ]}
            />
          )}
          {coop && (
            <div className="two">
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
              <Campo
                form={form}
                name="contrato_id"
                label="Contrato (opcional)"
                opcoes={contratos ?? []}
                vazio="Nenhum"
                hint="Só contratos do cooperado."
              />
            </div>
          )}
          <div className="two">
            <Campo
              form={form}
              name="categoria"
              label="Categoria"
              opcoes={Object.entries(CATEGORIA).map(([value, label]) => ({ value, label }))}
            />
            <Campo form={form} name="data_despesa" label="Data" type="date" />
          </div>
          <Campo form={form} name="descricao" label="Descrição" />
          <Campo form={form} name="valor" label="Valor (R$)" type="number" placeholder="0,00" />
        </Cartao>
        <div className="acts lg">
          <Button component={Link} variant="default" className="bt" to="/despesas">
            Cancelar
          </Button>
          <Button variant="default" className="bt pri" type="submit">
            <Icone n="check" />
            Registrar despesa
          </Button>
        </div>
      </form>
    </>
  );
}
