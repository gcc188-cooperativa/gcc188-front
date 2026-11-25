import { Button, NumberInput, Select, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ok } from "../../shared/api/client";
import { useClientes, useCooperados } from "../../shared/api/opcoes";
import { PageHeader } from "../../shared/ui";
import { aplicarErros } from "../../shared/ui/crud";
import { useSession } from "../auth/session";

const VAZIO = {
  cooperado_id: "",
  cliente_id: "",
  descricao: "",
  valor_total: "" as number | string,
  modalidade: "MENSAL",
  num_parcelas: 2 as number | string,
  dia_vencimento: 10 as number | string,
  data_inicio: "",
  data_fim: "",
  taxa_tipo: "PERCENTUAL",
  taxa_valor: "" as number | string,
};

export function ContratoFormPage() {
  const id = Number(useParams().id) || null;
  const nav = useNavigate();
  const { user } = useSession();
  const mot = user!.papel === "MOTORISTA";
  const form = useForm({ initialValues: VAZIO });
  const coops = useCooperados(!mot);
  const clientes = useClientes();
  const { data: atual } = useQuery({
    queryKey: ["contrato", id],
    enabled: !!id,
    queryFn: async () => ok(await api.GET("/contratos/{id}", { params: { path: { id: id! } } })),
  });
  useEffect(() => {
    if (atual)
      form.setValues({
        ...VAZIO,
        ...atual,
        cooperado_id: String(atual.cooperado_id),
        cliente_id: String(atual.cliente_id),
        data_fim: atual.data_fim ?? "",
        dia_vencimento: atual.dia_vencimento ?? "",
      });
  }, [atual]); // eslint-disable-line react-hooks/exhaustive-deps

  async function salvar(v: typeof VAZIO) {
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
    if (r.error) return aplicarErros(form, r.error); // 422 com campo: ex. taxa_valor (CA-09)
    notifications.show({ color: "teal", message: "Contrato salvo como rascunho." });
    nav(`/contratos/${r.data!.id}`);
  }
  const p = form.getInputProps;
  return (
    <>
      <PageHeader
        title={id ? "Editar contrato" : "Novo contrato"}
        sub="Fica em rascunho até você submeter à aprovação."
      />
      <form onSubmit={form.onSubmit(salvar)}>
        <Stack maw={720}>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            {!mot && (
              <Select
                label="Cooperado"
                required
                data={coops.data ?? []}
                searchable
                {...p("cooperado_id")}
              />
            )}
            <Select
              label="Cliente"
              required
              data={clientes.data ?? []}
              searchable
              {...p("cliente_id")}
            />
          </SimpleGrid>
          <TextInput label="Descrição do serviço" required {...p("descricao")} />
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <NumberInput
              label="Valor total (R$)"
              required
              min={0}
              decimalScale={2}
              fixedDecimalScale
              {...p("valor_total")}
            />
            <TextInput label="Início da vigência" type="date" required {...p("data_inicio")} />
            <Select
              label="Modalidade"
              allowDeselect={false}
              data={[
                { value: "MENSAL", label: "Mensal" },
                { value: "UNICO", label: "Pagamento único" },
              ]}
              {...p("modalidade")}
            />
            <TextInput label="Fim da vigência (opcional)" type="date" {...p("data_fim")} />
            {form.values.modalidade === "MENSAL" && (
              <>
                <NumberInput label="Parcelas" min={2} {...p("num_parcelas")} />
                <NumberInput
                  label="Dia do vencimento (1 a 28)"
                  min={1}
                  max={28}
                  {...p("dia_vencimento")}
                />
              </>
            )}
            <Select
              label="Tipo de taxa"
              allowDeselect={false}
              data={[
                { value: "PERCENTUAL", label: "Percentual" },
                { value: "FIXO", label: "Valor fixo por parcela" },
              ]}
              {...p("taxa_tipo")}
            />
            <NumberInput
              label={form.values.taxa_tipo === "PERCENTUAL" ? "Taxa (%)" : "Taxa (R$ por parcela)"}
              required
              min={0}
              decimalScale={2}
              {...p("taxa_valor")}
            />
          </SimpleGrid>
          <Button type="submit" w="fit-content">
            Salvar rascunho
          </Button>
        </Stack>
      </form>
    </>
  );
}
