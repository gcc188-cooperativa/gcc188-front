import { Button, NumberInput, Select, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ok } from "../../shared/api/client";
import { useCooperados } from "../../shared/api/opcoes";
import { PageHeader } from "../../shared/ui";
import { aplicarErros } from "../../shared/ui/crud";
import { useSession } from "../auth/session";
import { CATEGORIAS } from "./DespesasPage";

const VAZIO = {
  origem: "COOPERATIVA",
  categoria: "OUTROS",
  descricao: "",
  valor: "" as number | string,
  data_despesa: "",
  cooperado_id: "",
  contrato_id: "" as number | string,
};

export function DespesaFormPage() {
  const id = Number(useParams().id) || null;
  const nav = useNavigate();
  const { user } = useSession();
  const mot = user!.papel === "MOTORISTA";
  const form = useForm({ initialValues: { ...VAZIO, origem: mot ? "COOPERADO" : "COOPERATIVA" } });
  const coops = useCooperados(!mot);
  const { data: atual } = useQuery({
    queryKey: ["despesa", id],
    enabled: !!id,
    queryFn: async () => ok(await api.GET("/despesas/{id}", { params: { path: { id: id! } } })),
  });
  useEffect(() => {
    if (atual)
      form.setValues({
        ...VAZIO,
        ...atual,
        cooperado_id: atual.cooperado_id ? String(atual.cooperado_id) : "",
        contrato_id: atual.contrato_id ?? "",
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
      cooperado_id: coop ? (mot ? user!.vinculo_id : Number(v.cooperado_id)) : null,
      contrato_id: coop && v.contrato_id !== "" ? Number(v.contrato_id) : null,
    };
    const r = id
      ? await api.PUT("/despesas/{id}", {
          params: { path: { id } },
          body: { ...body, versao: atual!.versao },
        })
      : await api.POST("/despesas", { body });
    if (r.error) return aplicarErros(form, r.error);
    notifications.show({ color: "teal", message: "Despesa registrada." });
    nav("/despesas");
  }
  const p = form.getInputProps;
  const coop = form.values.origem === "COOPERADO";
  return (
    <>
      <PageHeader title={id ? "Editar despesa" : "Nova despesa"} />
      <form onSubmit={form.onSubmit(salvar)}>
        <Stack maw={720}>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {!mot && (
              <Select
                label="Origem"
                allowDeselect={false}
                data={["COOPERATIVA", "COOPERADO"]}
                {...p("origem")}
              />
            )}
            <Select label="Categoria" allowDeselect={false} data={CATEGORIAS} {...p("categoria")} />
            {coop && !mot && (
              <Select
                label="Cooperado"
                required
                searchable
                data={coops.data ?? []}
                {...p("cooperado_id")}
              />
            )}
            {coop && (
              <NumberInput label="Contrato (opcional, número)" min={1} {...p("contrato_id")} />
            )}
            <NumberInput
              label="Valor (R$)"
              required
              min={0}
              decimalScale={2}
              fixedDecimalScale
              {...p("valor")}
            />
            <TextInput label="Data" type="date" required {...p("data_despesa")} />
          </SimpleGrid>
          <TextInput label="Descrição" required {...p("descricao")} />
          <Button type="submit" w="fit-content">
            Registrar despesa
          </Button>
        </Stack>
      </form>
    </>
  );
}
