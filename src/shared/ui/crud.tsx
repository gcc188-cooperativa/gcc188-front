import {
  Button,
  Group,
  Modal,
  PasswordInput,
  Select,
  Stack,
  Table,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { msgErro, type Schemas } from "../api/client";
import { PageHeader, Paginacao } from "./index";

export type Valores = Record<string, unknown>;
export type Resultado = { error?: unknown };
export type Row = { id: number; ativo: boolean; [k: string]: unknown };
export type Campo = {
  name: string;
  label: string;
  type?: "text" | "password" | "email" | "date";
  criacao?: boolean;
  opcoes?: string[];
  obrigatorio?: boolean;
};
export type CrudConfig = {
  titulo: string;
  sub: string;
  chave: string;
  campos: Campo[];
  busca?: boolean;
  podeEscrever: boolean;
  colunas: { titulo: string; render: (r: Row) => ReactNode }[];
  listar: (page: number, busca: string) => Promise<{ content: Row[]; total_pages: number }>;
  criar: (v: Valores) => Promise<Resultado>;
  atualizar: (r: Row, v: Valores) => Promise<Resultado>;
  situacao: (id: number, ativo: boolean) => Promise<Resultado>;
  extra?: (r: Row) => ReactNode;
};

/** Mostra erros 400/422 junto ao campo (RF-WEB-04, CA-09); sem campo, vira notificação. */
export function aplicarErros(form: { setErrors: (e: Record<string, string>) => void }, e: unknown) {
  const campos = (e as Schemas["ProblemDetail"])?.campos_invalidos;
  if (campos?.length) form.setErrors(Object.fromEntries(campos.map((c) => [c.campo, c.mensagem])));
  else notifications.show({ color: "red", message: msgErro(e) });
}
const limpar = (v: Valores): Valores =>
  Object.fromEntries(
    Object.entries(v)
      .filter(([, x]) => x !== "")
      .map(([k, x]) => [k, x && typeof x === "object" ? limpar(x as Valores) : x]),
  );
const get = (o: unknown, p: string) =>
  p.split(".").reduce<unknown>((a, k) => (a as Valores | undefined)?.[k], o);
function set(o: Valores, p: string, v: unknown) {
  const ks = p.split(".");
  let c = o;
  ks.slice(0, -1).forEach((k) => {
    c = (c[k] ??= {}) as Valores;
  });
  c[ks[ks.length - 1]] = v;
}

function FormModal({
  cfg,
  row,
  onClose,
}: {
  cfg: CrudConfig;
  row: Row | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const campos = cfg.campos.filter((c) => !row || !c.criacao);
  const iniciais: Valores = {};
  campos.forEach((c) => set(iniciais, c.name, row ? (get(row, c.name) ?? "") : ""));
  const form = useForm<Valores>({ initialValues: iniciais });
  async function salvar(v: Valores) {
    const body = limpar(v);
    const r = row ? await cfg.atualizar(row, body) : await cfg.criar(body);
    if (r.error) return aplicarErros(form, r.error);
    notifications.show({ color: "teal", message: "Cadastro salvo." });
    qc.invalidateQueries({ queryKey: [cfg.chave] });
    onClose();
  }
  return (
    <Modal opened onClose={onClose} title={row ? "Editar cadastro" : "Novo cadastro"}>
      <form onSubmit={form.onSubmit(salvar)}>
        <Stack>
          {campos.map((c) => {
            const p = form.getInputProps(c.name);
            if (c.opcoes)
              return (
                <Select
                  key={c.name}
                  label={c.label}
                  data={c.opcoes}
                  required={c.obrigatorio}
                  {...p}
                />
              );
            if (c.type === "password")
              return <PasswordInput key={c.name} label={c.label} required={c.obrigatorio} {...p} />;
            return (
              <TextInput
                key={c.name}
                label={c.label}
                type={c.type}
                required={c.obrigatorio}
                {...p}
              />
            );
          })}
          <Button type="submit">Salvar cadastro</Button>
        </Stack>
      </form>
    </Modal>
  );
}

/** Listagem + formulário reutilizável (ListPage e FormPage do Design). */
export function CrudPage({ cfg }: { cfg: CrudConfig }) {
  const [page, setPage] = useState(0);
  const [busca, setBusca] = useState("");
  const [alvo, setAlvo] = useState<Row | "novo" | null>(null);
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: [cfg.chave, page, busca],
    queryFn: () => cfg.listar(page, busca),
  });
  const alternar = (r: Row) =>
    modals.openConfirmModal({
      title: r.ativo ? "Inativar cadastro?" : "Reativar cadastro?",
      labels: { confirm: "Confirmar", cancel: "Voltar" },
      onConfirm: async () => {
        const x = await cfg.situacao(r.id, !r.ativo);
        if (x.error) notifications.show({ color: "red", message: msgErro(x.error) });
        else qc.invalidateQueries({ queryKey: [cfg.chave] });
      },
    });
  return (
    <>
      <PageHeader
        title={cfg.titulo}
        sub={cfg.sub}
        actions={cfg.podeEscrever && <Button onClick={() => setAlvo("novo")}>Novo cadastro</Button>}
      />
      {cfg.busca && (
        <TextInput
          mb="md"
          placeholder="Buscar por nome"
          aria-label="Buscar por nome"
          value={busca}
          onChange={(e) => {
            setBusca(e.currentTarget.value);
            setPage(0);
          }}
        />
      )}
      <Table.ScrollContainer minWidth={600}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              {cfg.colunas.map((c) => (
                <Table.Th key={c.titulo}>{c.titulo}</Table.Th>
              ))}
              {cfg.podeEscrever && <Table.Th />}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {data?.content.map((r) => (
              <Table.Tr key={r.id}>
                {cfg.colunas.map((c) => (
                  <Table.Td key={c.titulo}>{c.render(r)}</Table.Td>
                ))}
                {cfg.podeEscrever && (
                  <Table.Td>
                    <Group gap="xs">
                      <Button size="xs" variant="default" onClick={() => setAlvo(r)}>
                        Editar
                      </Button>
                      <Button size="xs" variant="default" onClick={() => alternar(r)}>
                        {r.ativo ? "Inativar" : "Reativar"}
                      </Button>
                      {cfg.extra?.(r)}
                    </Group>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      {data?.content.length === 0 && (
        <p>Nada cadastrado ainda. Use “Novo cadastro” para começar.</p>
      )}
      <Paginacao page={page} total={data?.total_pages ?? 0} onChange={setPage} />
      {alvo && (
        <FormModal cfg={cfg} row={alvo === "novo" ? null : alvo} onClose={() => setAlvo(null)} />
      )}
    </>
  );
}
