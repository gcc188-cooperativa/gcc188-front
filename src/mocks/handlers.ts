import dayjs from "dayjs";
import { http, HttpResponse } from "msw";
import { db, me, vinculo, type Contrato, type Pagamento, type Usuario } from "./db";

const B = "*/api/v1";
type Info = { request: Request; params: Record<string, string | readonly string[] | undefined> };
type Fn = (i: Info, u: Usuario) => Response | Promise<Response>;
export const prob = (status: number, title: string, extra: object = {}) =>
  HttpResponse.json({ title, status, ...extra }, { status });
const campo = (c: string, m: string, regra?: string) =>
  prob(422, "Regra de negócio violada.", {
    campos_invalidos: [{ campo: c, mensagem: m }],
    codigo_regra: regra,
  });
const rota = (m: "get" | "post" | "put" | "patch" | "delete") => (path: string, fn: Fn) =>
  http[m](B + path, (i) => {
    const u = me();
    return u ? fn(i as Info, u) : prob(401, "Não autenticado.");
  });
const [GET, POST, PUT, PATCH, DEL] = (["get", "post", "put", "patch", "delete"] as const).map(rota);
const r2 = (n: number) => Math.round(n * 100) / 100;
const id = (i: Info) => Number(i.params.id);
const body = async (i: Info) =>
  (await i.request.json()) as Record<string, unknown> & { versao?: number };
const qs = (i: Info) => new URL(i.request.url).searchParams;
const pagina = <T>(arr: T[], i: Info) => {
  const q = qs(i),
    size = Number(q.get("size") ?? 20),
    page = Number(q.get("page") ?? 0);
  return HttpResponse.json({
    content: arr.slice(page * size, (page + 1) * size),
    page,
    size,
    total_elements: arr.length,
    total_pages: Math.ceil(arr.length / size),
  });
};
const sessao = (x: Usuario) => ({
  usuario_id: x.id,
  nome: x.nome,
  email: x.email,
  papel: x.papel,
  vinculo_id: vinculo(x),
  deve_trocar_senha: x.deve_trocar_senha,
});
const hoje = () => dayjs().format("YYYY-MM-DD");
const soma = (
  ps: { valor_bruto: number; valor_taxa: number; valor_liquido: number }[],
  k: "valor_bruto" | "valor_taxa" | "valor_liquido",
) => r2(ps.reduce((s, p) => s + p[k], 0));

const contratosDe = (x: Usuario) =>
  db.contratos.filter((c) =>
    x.papel === "MOTORISTA"
      ? c.cooperado_id === vinculo(x)
      : x.papel === "CLIENTE"
        ? c.cliente_id === vinculo(x)
        : true,
  );
const pagamentosDe = (x: Usuario) => {
  const ids = contratosDe(x).map((c) => c.id);
  return db.pagamentos.filter((p) => ids.includes(p.contrato_id));
};
const detalhe = (c: Contrato) => ({
  ...c,
  cooperado: db.cooperados.find((o) => o.id === c.cooperado_id),
  cliente: db.clientes.find((o) => o.id === c.cliente_id),
  pagamentos: db.pagamentos.filter((p) => p.contrato_id === c.id),
});
const achar = (i: Info, u: Usuario) => contratosDe(u).find((c) => c.id === id(i));

function validarTaxa(v: Record<string, unknown>) {
  const parcela = Number(v.valor_total) / Number(v.num_parcelas || 1),
    t = Number(v.taxa_valor);
  if (v.taxa_tipo === "PERCENTUAL" && t > 100)
    return campo("taxa_valor", "A taxa não pode exceder o valor bruto.", "RN03");
  if (v.taxa_tipo === "FIXO" && t > parcela)
    return campo("taxa_valor", "A taxa não pode exceder o valor bruto.", "RN03");
  return null;
}
function gerarCronograma(c: Contrato) {
  // RN05; só para o mock
  const bruto = r2(c.valor_total / c.num_parcelas);
  let acc = 0;
  for (let n = 1; n <= c.num_parcelas; n++) {
    const b = n === c.num_parcelas ? r2(c.valor_total - acc) : bruto;
    acc += b;
    const x = r2(c.taxa_tipo === "PERCENTUAL" ? (b * c.taxa_valor) / 100 : c.taxa_valor);
    db.pagamentos.push({
      id: db.pagamentos.length + 100 + n,
      contrato_id: c.id,
      numero_parcela: n,
      valor_bruto: b,
      valor_taxa: x,
      valor_liquido: r2(b - x),
      status: "PREVISTO",
      data_vencimento: dayjs(c.data_inicio)
        .add(n - 1, "month")
        .date(c.dia_vencimento ?? 10)
        .format("YYYY-MM-DD"),
      data_baixa: null,
      baixado_por_id: null,
      data_repasse: null,
      repassado_por_id: null,
      observacao: null,
      versao: 0,
      criado_em: "",
      atualizado_em: "",
    });
  }
}
function transicao(
  path: string,
  de: string[],
  para: string,
  extra?: (c: Contrato, u: Usuario, b: Record<string, unknown>) => Response | void,
  admin = true,
) {
  return POST(`/contratos/:id/${path}`, async (i, u) => {
    const c = achar(i, u);
    if (!c) return prob(404, "Contrato não encontrado.");
    if (admin && u.papel !== "ADMINISTRADOR") return prob(403, "Papel sem permissão.");
    if (!de.includes(c.status)) return prob(409, "Transição de estado inválida.");
    const r = extra?.(
      c,
      u,
      i.request.headers.get("content-length") === "0" ? {} : await body(i).catch(() => ({})),
    );
    if (r) return r;
    c.status = para;
    return HttpResponse.json(c);
  });
}
const pgto = (
  path: string,
  de: string,
  para: string,
  papeis: string[],
  f: (p: Pagamento, b: Record<string, unknown>) => void,
) =>
  POST(`/pagamentos/:id/${path}`, async (i, u) => {
    if (!papeis.includes(u.papel)) return prob(403, "Papel sem permissão.");
    const p = pagamentosDe(u).find((x) => x.id === id(i));
    if (!p) return prob(404, "Pagamento não encontrado.");
    if (p.status !== de) return prob(409, "Transição de estado inválida.");
    f(p, await body(i));
    p.status = para;
    return HttpResponse.json(p);
  });
const despesasDe = (x: Usuario) =>
  db.despesas.filter((d) => x.papel !== "MOTORISTA" || d.cooperado_id === vinculo(x));
const filtrarDesp = (i: Info, u: Usuario) => {
  const q = qs(i);
  return despesasDe(u).filter(
    (d) =>
      (!q.get("origem") || d.origem === q.get("origem")) &&
      (!q.get("categoria") || d.categoria === q.get("categoria")),
  );
};

/** Cadastro com usuário (RN14): cooperado ou cliente + usuário na mesma operação. */
const cadastro = (rec: "cooperados" | "clientes", papel: string) => [
  GET(`/${rec}`, (i) => {
    const n = qs(i).get("nome")?.toLowerCase();
    return pagina(
      db[rec].filter((x) => !n || x.nome.toLowerCase().includes(n)),
      i,
    );
  }),
  GET(`/${rec}/:id`, (i) => {
    const x = db[rec].find((o) => o.id === id(i));
    return x ? HttpResponse.json(x) : prob(404, "Não encontrado.");
  }),
  POST(`/${rec}`, async (i) => {
    const { usuario, ...d } = (await body(i)) as {
      usuario: { email: string; senha: string };
    } & Record<string, unknown>;
    if (db.usuarios.some((x) => x.email === usuario.email))
      return prob(409, "E-mail já cadastrado.", {
        campos_invalidos: [{ campo: "usuario.email", mensagem: "E-mail já cadastrado." }],
      });
    const uid = db.usuarios.length + 10;
    const base = { versao: 0, criado_em: "", atualizado_em: "" };
    db.usuarios.push({
      id: uid,
      nome: String(d.nome),
      email: usuario.email,
      papel,
      ativo: true,
      deve_trocar_senha: true,
      ...base,
    });
    const novo = {
      id: db[rec].length + 10,
      usuario_id: uid,
      ativo: true,
      telefone: null,
      ...base,
      ...d,
    } as never;
    (db[rec] as unknown[]).push(novo);
    return HttpResponse.json(novo, { status: 201 });
  }),
  PUT(`/${rec}/:id`, async (i) => {
    const x = db[rec].find((o) => o.id === id(i));
    if (!x) return prob(404, "Não encontrado.");
    Object.assign(x, await body(i));
    return HttpResponse.json(x);
  }),
  PATCH(`/${rec}/:id/situacao`, async (i) => {
    const x = db[rec].find((o) => o.id === id(i));
    if (!x) return prob(404, "Não encontrado.");
    x.ativo = (await body(i)).ativo as boolean;
    return HttpResponse.json(x);
  }),
];

export const handlers = [
  http.post(`${B}/auth/login`, async ({ request }) => {
    const { email, senha } = (await request.json()) as { email: string; senha: string };
    const x = db.usuarios.find((o) => o.email === email);
    if (!x || senha !== "senha-correta-123") return prob(401, "Credenciais inválidas.");
    sessionStorage.setItem("mock-user", String(x.id));
    return HttpResponse.json(sessao(x));
  }),
  http.post(`${B}/auth/refresh`, () => {
    const x = me();
    return x ? HttpResponse.json(sessao(x)) : prob(401, "Sessão expirada.");
  }),
  POST("/auth/logout", () => {
    sessionStorage.removeItem("mock-user");
    return new HttpResponse(null, { status: 204 });
  }),
  GET("/auth/me", (_, u) => HttpResponse.json(sessao(u))),
  POST("/auth/alterar-senha", async (i, u) => {
    const b = await body(i);
    if (String(b.nova_senha).length < 12)
      return campo("nova_senha", "Use ao menos 12 caracteres.", "SENHA");
    u.deve_trocar_senha = false;
    return new HttpResponse(null, { status: 204 });
  }),

  GET("/usuarios", (i, u) =>
    u.papel === "ADMINISTRADOR"
      ? pagina(
          db.usuarios.filter((x) => !qs(i).get("papel") || x.papel === qs(i).get("papel")),
          i,
        )
      : prob(403, "Papel sem permissão."),
  ),
  POST("/usuarios", async (i) => {
    const b = await body(i);
    if (db.usuarios.some((x) => x.email === b.email))
      return prob(409, "E-mail já cadastrado.", {
        campos_invalidos: [{ campo: "email", mensagem: "E-mail já cadastrado." }],
      });
    const n = {
      id: db.usuarios.length + 10,
      ativo: true,
      deve_trocar_senha: true,
      versao: 0,
      criado_em: "",
      atualizado_em: "",
      ...b,
    } as never;
    db.usuarios.push(n);
    return HttpResponse.json(n, { status: 201 });
  }),
  PUT("/usuarios/:id", async (i) => {
    const x = db.usuarios.find((o) => o.id === id(i));
    if (!x) return prob(404, "Não encontrado.");
    const b = await body(i);
    if (b.versao !== x.versao) return prob(409, "Versão divergente.");
    Object.assign(x, b, { versao: x.versao + 1 });
    return HttpResponse.json(x);
  }),
  PATCH("/usuarios/:id/situacao", async (i) => {
    const x = db.usuarios.find((o) => o.id === id(i));
    if (!x) return prob(404, "Não encontrado.");
    x.ativo = (await body(i)).ativo as boolean;
    return HttpResponse.json(x);
  }),
  POST("/usuarios/:id/redefinicao-senha", () => new HttpResponse(null, { status: 204 })),
  ...cadastro("cooperados", "MOTORISTA"),
  ...cadastro("clientes", "CLIENTE"),

  GET("/contratos", (i, u) => {
    const s = qs(i).get("status");
    return pagina(
      contratosDe(u).filter((c) => !s || c.status === s),
      i,
    );
  }),
  POST("/contratos", async (i, u) => {
    const b = await body(i);
    const e = validarTaxa(b);
    if (e) return e;
    const c = {
      id: db.contratos.length + 200,
      status: "RASCUNHO",
      criado_por_id: u.id,
      aprovado_por_id: null,
      aprovado_em: null,
      motivo_reprovacao: null,
      versao: 0,
      criado_em: "",
      atualizado_em: "",
      ...b,
    } as never;
    db.contratos.push(c);
    return HttpResponse.json(c, { status: 201 });
  }),
  GET("/contratos/:id", (i, u) => {
    const c = achar(i, u);
    return c ? HttpResponse.json(detalhe(c)) : prob(404, "Contrato não encontrado.");
  }),
  PUT("/contratos/:id", async (i, u) => {
    const c = achar(i, u);
    if (!c) return prob(404, "Contrato não encontrado.");
    const b = await body(i);
    if (c.status !== "RASCUNHO" || b.versao !== c.versao)
      return prob(409, "Contrato não editável ou versão divergente.");
    const e = validarTaxa(b);
    if (e) return e;
    Object.assign(c, b, { versao: c.versao + 1 });
    return HttpResponse.json(c);
  }),
  DEL("/contratos/:id", (i, u) => {
    const c = achar(i, u);
    if (!c) return prob(404, "Contrato não encontrado.");
    if (c.status !== "RASCUNHO") return prob(409, "Só rascunho pode ser excluído.");
    db.contratos.splice(db.contratos.indexOf(c), 1);
    return new HttpResponse(null, { status: 204 });
  }),
  transicao("submissao", ["RASCUNHO"], "PENDENTE_APROVACAO", undefined, false),
  transicao("aprovacao", ["PENDENTE_APROVACAO"], "ATIVO", (c, u) => {
    if (c.criado_por_id === u.id)
      return prob(403, "Quem elaborou o contrato não o aprova.", { codigo_regra: "RN12" });
    c.aprovado_por_id = u.id;
    gerarCronograma(c);
  }),
  transicao("reprovacao", ["PENDENTE_APROVACAO"], "RASCUNHO", (c, _u, b) => {
    c.motivo_reprovacao = String(b.motivo ?? "");
  }),
  transicao("encerramento", ["ATIVO"], "ENCERRADO", (c) =>
    db.pagamentos.some(
      (p) => p.contrato_id === c.id && (p.status === "PREVISTO" || p.status === "PAGO"),
    )
      ? prob(409, "Há pagamentos pendentes.", { codigo_regra: "RN06" })
      : undefined,
  ),
  transicao("cancelamento", ["RASCUNHO", "PENDENTE_APROVACAO", "ATIVO"], "CANCELADO", (c) => {
    db.pagamentos
      .filter((p) => p.contrato_id === c.id && p.status === "PREVISTO")
      .forEach((p) => {
        p.status = "CANCELADO";
      });
  }),
  GET("/contratos/:id/pagamentos", (i, u) =>
    pagina(
      pagamentosDe(u).filter((p) => p.contrato_id === id(i)),
      i,
    ),
  ),

  GET("/pagamentos", (i, u) => {
    const q = qs(i),
      s = q.get("status");
    return pagina(
      pagamentosDe(u).filter(
        (p) =>
          (!s || p.status === s) &&
          (q.get("em_atraso") !== "true" ||
            (p.status === "PREVISTO" && p.data_vencimento < hoje())),
      ),
      i,
    );
  }),
  GET("/pagamentos/:id", (i, u) => {
    const p = pagamentosDe(u).find((x) => x.id === id(i));
    return p ? HttpResponse.json(p) : prob(404, "Pagamento não encontrado.");
  }),
  pgto("baixa", "PREVISTO", "PAGO", ["FINANCEIRO"], (p, b) => {
    p.data_baixa = String(b.data_baixa);
  }),
  pgto("repasse", "PAGO", "REPASSADO", ["FINANCEIRO"], (p, b) => {
    p.data_repasse = String(b.data_repasse);
  }),
  pgto("estorno", "PAGO", "PREVISTO", ["FINANCEIRO", "ADMINISTRADOR"], (p) => {
    p.data_baixa = null;
  }),

  GET("/despesas", (i, u) => pagina(filtrarDesp(i, u), i)),
  GET("/despesas/totais", (i, u) => {
    const l = filtrarDesp(i, u),
      cat: Record<string, number> = {};
    l.forEach((d) => {
      cat[d.categoria] = r2((cat[d.categoria] ?? 0) + d.valor);
    });
    return HttpResponse.json({
      total_geral: r2(l.reduce((s, d) => s + d.valor, 0)),
      por_categoria: Object.entries(cat).map(([categoria, total]) => ({ categoria, total })),
    });
  }),
  GET("/despesas/:id", (i, u) => {
    const d = despesasDe(u).find((x) => x.id === id(i));
    return d ? HttpResponse.json(d) : prob(404, "Despesa não encontrada.");
  }),
  POST("/despesas", async (i, u) => {
    const b = await body(i);
    if (b.origem === "COOPERATIVA" && b.cooperado_id)
      return campo("cooperado_id", "Despesa da cooperativa não tem cooperado.", "RN08");
    const d = {
      id: db.despesas.length + 10,
      registrado_por_id: u.id,
      versao: 0,
      criado_em: "",
      atualizado_em: "",
      ...b,
    } as never;
    db.despesas.push(d);
    return HttpResponse.json(d, { status: 201 });
  }),
  PUT("/despesas/:id", async (i, u) => {
    const d = despesasDe(u).find((x) => x.id === id(i));
    if (!d) return prob(404, "Despesa não encontrada.");
    Object.assign(d, await body(i));
    return HttpResponse.json(d);
  }),
  DEL("/despesas/:id", (i, u) => {
    const d = despesasDe(u).find((x) => x.id === id(i));
    if (!d) return prob(404, "Despesa não encontrada.");
    db.despesas.splice(db.despesas.indexOf(d), 1);
    return new HttpResponse(null, { status: 204 });
  }),

  GET("/cooperados/:id/extrato", (i, u) => {
    const c = db.cooperados.find((x) => x.id === id(i));
    if (!c || (u.papel === "MOTORISTA" && vinculo(u) !== c.id))
      return prob(404, "Cooperado não encontrado.");
    const ids = db.contratos.filter((x) => x.cooperado_id === c.id).map((x) => x.id),
      ps = db.pagamentos.filter(
        (p) => ids.includes(p.contrato_id) && (p.status === "PAGO" || p.status === "REPASSADO"),
      ),
      ds = db.despesas.filter((d) => d.cooperado_id === c.id);
    return HttpResponse.json({
      cooperado: c,
      data_inicio: qs(i).get("data_inicio"),
      data_fim: qs(i).get("data_fim"),
      pagamentos: ps.map((p) => ({ ...p, pagamento_id: p.id })),
      despesas: ds,
      total_bruto: soma(ps, "valor_bruto"),
      total_taxa: soma(ps, "valor_taxa"),
      total_liquido: soma(ps, "valor_liquido"),
      total_repassado: soma(
        ps.filter((p) => p.status === "REPASSADO"),
        "valor_liquido",
      ),
      total_a_repassar: soma(
        ps.filter((p) => p.status === "PAGO"),
        "valor_liquido",
      ),
      total_despesas: r2(ds.reduce((s, d) => s + d.valor, 0)),
    });
  }),
  GET("/relatorios/resumo-financeiro", (i) => {
    const q = qs(i),
      ps = db.pagamentos,
      tx = soma(
        ps.filter((p) => p.status === "PAGO" || p.status === "REPASSADO"),
        "valor_taxa",
      ),
      dc = r2(
        db.despesas.filter((d) => d.origem === "COOPERATIVA").reduce((s, d) => s + d.valor, 0),
      );
    return HttpResponse.json({
      data_inicio: q.get("data_inicio"),
      data_fim: q.get("data_fim"),
      taxas_arrecadadas: tx,
      a_repassar: soma(
        ps.filter((p) => p.status === "PAGO"),
        "valor_liquido",
      ),
      repassado: soma(
        ps.filter((p) => p.status === "REPASSADO"),
        "valor_liquido",
      ),
      despesas_cooperativa: dc,
      saldo: r2(tx - dc),
    });
  }),
  GET("/relatorios/inadimplencia", () => {
    const atrasados = db.pagamentos.filter(
        (p) => p.status === "PREVISTO" && p.data_vencimento < hoje(),
      ),
      por = new Map<number, number[]>();
    atrasados.forEach((p) => {
      const cid = db.contratos.find((c) => c.id === p.contrato_id)!.cliente_id;
      por.set(cid, [...(por.get(cid) ?? []), p.valor_bruto]);
    });
    return HttpResponse.json({
      por_cooperado: [],
      por_cliente: [...por].map(([cid, v]) => ({
        cliente: db.clientes.find((c) => c.id === cid),
        quantidade: v.length,
        valor_total: r2(v.reduce((s, x) => s + x, 0)),
      })),
    });
  }),
  GET("/painel/indicadores", (_, u) => {
    const ps = pagamentosDe(u),
      ab = ps.filter((p) => p.status === "PREVISTO"),
      at = ab.filter((p) => p.data_vencimento < hoje()),
      rp = ps.filter((p) => p.status === "PAGO");
    const iv = (l: typeof ps) => ({ quantidade: l.length, valor: soma(l, "valor_bruto") });
    return HttpResponse.json({
      ...(u.papel === "ADMINISTRADOR"
        ? {
            contratos_pendentes_aprovacao: db.contratos.filter(
              (c) => c.status === "PENDENTE_APROVACAO",
            ).length,
          }
        : {}),
      contratos_ativos: contratosDe(u).filter((c) => c.status === "ATIVO").length,
      pagamentos_a_receber: iv(ab),
      pagamentos_em_atraso: iv(at),
      ...(u.papel !== "CLIENTE" ? { pagamentos_a_repassar: iv(rp) } : {}),
      proximos_vencimentos: [...ab]
        .sort((a, b) => a.data_vencimento.localeCompare(b.data_vencimento))
        .slice(0, 5),
    });
  }),
];
