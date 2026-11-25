import { Button, NativeSelect, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { msgErro } from "../api/client";
import { Acoes, type Acao } from "./acoes";
import { confirmar } from "./confirm";
import { Campo, aplicarErros, type Op, type Resultado, type Valores } from "./form";
import { Icone } from "./icons";
import { Cartao, PageHeader, Paginacao, StatusBadge } from "./index";
import { Tabela, type Col } from "./tabela";
import { toast } from "./toast";

export type Row = { id: number; ativo: boolean; [k: string]: unknown };
export type CampoCfg = {
  name: string;
  label: string;
  type?: string;
  criacao?: boolean;
  opcoes?: Op[];
  hint?: string;
};
export type CadastroCfg = {
  chave: string;
  base: string;
  singular: string;
  titulo: string;
  sub: string;
  subNovo: string;
  busca?: string;
  opcoesPapel?: Op[];
  podeEscrever: boolean;
  colunas: Col<Row>[];
  secoes: { titulo: string; campos: CampoCfg[] }[];
  listar: (f: {
    page: number;
    busca: string;
    ativo?: boolean;
    papel?: string;
  }) => Promise<{ content: Row[]; total_pages: number }>;
  obter: (id: number) => Promise<Row>;
  criar: (v: Valores) => Promise<Resultado>;
  atualizar: (r: Row, v: Valores) => Promise<Resultado>;
  situacao: (id: number, ativo: boolean) => Promise<Resultado>;
  extra?: (r: Row) => Acao[];
};
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
const limpar = (v: Valores): Valores =>
  Object.fromEntries(
    Object.entries(v)
      .filter(([, x]) => x !== "")
      .map(([k, x]) => [k, x && typeof x === "object" ? limpar(x as Valores) : x]),
  );

/** Listagem do protótipo: filtros, tabela ordenável e ações em botão dividido. */
export function CadastroLista({ cfg }: { cfg: CadastroCfg }) {
  const [page, setPage] = useState(0),
    [busca, setBusca] = useState(""),
    [sit, setSit] = useState(""),
    [papel, setPapel] = useState("");
  const qc = useQueryClient(),
    nav = useNavigate();
  const ativo = sit ? sit === "true" : undefined;
  const { data } = useQuery({
    queryKey: [cfg.chave, page, busca, sit, papel],
    queryFn: () => cfg.listar({ page, busca, ativo, papel: papel || undefined }),
  });
  const alternar = (r: Row) =>
    confirmar({
      titulo: r.ativo ? "Inativar cadastro?" : "Reativar cadastro?",
      perigo: r.ativo,
      aoConfirmar: async () => {
        const x = await cfg.situacao(r.id, !r.ativo);
        if (x.error) toast(msgErro(x.error), true);
        else qc.invalidateQueries({ queryKey: [cfg.chave] });
      },
    });
  const acoes = (r: Row): Acao[] => [
    { rotulo: "Editar", fazer: () => nav(`${cfg.base}/${r.id}/editar`) },
    ...(cfg.extra?.(r) ?? []),
    r.ativo
      ? { rotulo: "Inativar", perigo: true, fazer: () => alternar(r) }
      : { rotulo: "Reativar", fazer: () => alternar(r) },
  ];
  const cols = cfg.podeEscrever
    ? [...cfg.colunas, { t: "Ações", r: (r: Row) => <Acoes acoes={acoes(r)} /> }]
    : cfg.colunas;
  const volta = () => setPage(0);
  return (
    <>
      <PageHeader
        title={cfg.titulo}
        sub={cfg.sub}
        actions={
          cfg.podeEscrever && (
            <Button component={Link} variant="default" className="bt pri" to={`${cfg.base}/novo`}>
              <Icone n="plus" />
              Novo {cfg.singular}
            </Button>
          )
        }
      />
      <div className="fl">
        {cfg.busca && (
          <TextInput
            placeholder={cfg.busca}
            aria-label={cfg.busca}
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              volta();
            }}
          />
        )}
        {cfg.opcoesPapel && (
          <NativeSelect
            aria-label="Papel"
            value={papel}
            onChange={(e) => {
              setPapel(e.target.value);
              volta();
            }}
          >
            <option value="">Papel: todos</option>
            {cfg.opcoesPapel.map((o) =>
              typeof o === "string" ? null : (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ),
            )}
          </NativeSelect>
        )}
        <NativeSelect
          aria-label="Situação"
          value={sit}
          onChange={(e) => {
            setSit(e.target.value);
            volta();
          }}
        >
          <option value="">Situação: todas</option>
          <option value="true">Ativo</option>
          <option value="false">Inativo</option>
        </NativeSelect>
      </div>
      <Tabela cols={cols} rows={data?.content ?? []} k={(r) => r.id} />
      {data?.content.length === 0 && <p className="sub">Nada cadastrado ainda.</p>}
      <Paginacao page={page} total={data?.total_pages ?? 0} onChange={setPage} />
    </>
  );
}
export const SituacaoBadge = ({ r }: { r: Row }) => (
  <StatusBadge s={r.ativo ? "ATIVO" : "INATIVO"} />
);

/** Formulário em página (criar e editar), em cartões por seção, como no protótipo. */
export function CadastroForm({ cfg }: { cfg: CadastroCfg }) {
  const id = Number(useParams().id) || null,
    nav = useNavigate(),
    qc = useQueryClient();
  const secoes = cfg.secoes
    .map((s) => ({ ...s, campos: s.campos.filter((c) => !id || !c.criacao) }))
    .filter((s) => s.campos.length);
  const iniciais: Valores = {};
  secoes.forEach((s) => s.campos.forEach((c) => set(iniciais, c.name, "")));
  const form = useForm<Valores>({ initialValues: iniciais });
  const { data: atual } = useQuery({
    queryKey: [cfg.chave, "um", id],
    enabled: !!id,
    queryFn: () => cfg.obter(id!),
  });
  useEffect(() => {
    if (atual) {
      const v: Valores = {};
      secoes.forEach((s) => s.campos.forEach((c) => set(v, c.name, get(atual, c.name) ?? "")));
      form.setValues(v);
    }
  }, [atual]); // eslint-disable-line react-hooks/exhaustive-deps
  async function salvar(v: Valores) {
    const body = limpar(v);
    const r = atual ? await cfg.atualizar(atual, body) : await cfg.criar(body);
    if (r.error) return aplicarErros(form, r.error);
    toast("Cadastro salvo.");
    qc.invalidateQueries({ queryKey: [cfg.chave] });
    nav(cfg.base);
  }
  return (
    <>
      <PageHeader
        title={`${id ? "Editar" : "Novo"} ${cfg.singular}`}
        sub={id ? undefined : cfg.subNovo}
      />
      <form noValidate onSubmit={form.onSubmit(salvar)}>
        {secoes.map((s) => (
          <Cartao key={s.titulo} t={s.titulo}>
            <div className="two">
              {s.campos.map((c) => (
                <Campo
                  key={c.name}
                  form={form}
                  name={c.name}
                  label={c.label}
                  type={c.type}
                  opcoes={c.opcoes}
                  vazio={c.opcoes ? "Selecione" : undefined}
                  hint={c.hint}
                />
              ))}
            </div>
          </Cartao>
        ))}
        <div className="acts lg">
          <Link className="bt" to={cfg.base}>
            Cancelar
          </Link>
          <Button variant="default" className="bt pri" type="submit">
            <Icone n="check" />
            Salvar cadastro
          </Button>
        </div>
      </form>
    </>
  );
}
