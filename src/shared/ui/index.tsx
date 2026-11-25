import { Badge, Button } from "@mantine/core";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { Icone } from "./icons";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const reais = (v: number) => brl.format(v);
/** Exibe valor já calculado pela API (D39). `c` = classe de cor: b, d, t ou l. */
export const Dinheiro = ({ v, c = "" }: { v: number; c?: string }) => (
  <span className={`num ${c}`}>{brl.format(v)}</span>
);
/** Datas AAAA-MM-DD não passam por new Date() para não deslocar o dia (UTC). */
export const Data = ({ v }: { v?: string | null }) => (
  <>{v ? dayjs(v).format("DD/MM/YYYY") : "—"}</>
);

const S: Record<string, [string, string, string]> = {
  RASCUNHO: ["gray", "pen", "Rascunho"],
  PENDENTE_APROVACAO: ["amb", "hour", "Pendente de aprovação"],
  ATIVO: ["teal", "play", "Ativo"],
  ENCERRADO: ["verde", "check2", "Encerrado"],
  CANCELADO: ["gray canc", "ban", "Cancelado"],
  PREVISTO: ["gray", "hour", "Previsto"],
  PAGO: ["teal", "check", "Pago"],
  REPASSADO: ["verde", "check2", "Repassado"],
  ATRASO: ["red", "alert", "Em atraso"],
  INATIVO: ["gray", "ban", "Inativo"],
};
export const rotuloStatus = (s: string) => S[s]?.[2] ?? s;
export const StatusBadge = ({ s }: { s: string }) => {
  const [cl, ic, rot] = S[s] ?? ["gray", "ban", s];
  return (
    <Badge variant="light" className={`badge ${cl}`} leftSection={<Icone n={ic} />}>
      {rot}
    </Badge>
  );
};
export const PAPEL: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  FINANCEIRO: "Financeiro",
  MOTORISTA: "Motorista",
  CLIENTE: "Cliente",
};
export const CATEGORIA: Record<string, string> = {
  COMBUSTIVEL: "Combustível",
  PEDAGIO: "Pedágio",
  MANUTENCAO: "Manutenção",
  ADMINISTRATIVA: "Administrativa",
  TRIBUTOS: "Tributos",
  OUTROS: "Outros",
};

export const PageHeader = ({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  actions?: ReactNode;
}) => (
  <div className="ph">
    <div>
      <h2>{title}</h2>
      {sub && <p className="sub">{sub}</p>}
    </div>
    <div className="acts">{actions}</div>
  </div>
);
export const Kpi = ({ i, l, v, c = "" }: { i: string; l: string; v: ReactNode; c?: string }) => (
  <div className="card">
    <div className={`vl ${c}`}>
      <Icone n={i} />
      {l}
    </div>
    <div className={`val ${c}`}>{v}</div>
  </div>
);
export const Nota = ({ children }: { children: ReactNode }) => (
  <div className="note">{children}</div>
);
export const Cartao = ({ t, children }: { t?: string; children: ReactNode }) => (
  <div className="card">
    {t && <h3>{t}</h3>}
    {children}
  </div>
);
export const Secao = ({ t, aside }: { t: string; aside?: ReactNode }) => (
  <div className="sec">
    <h3>{t}</h3>
    {aside}
  </div>
);
export function Paginacao({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (p: number) => void;
}) {
  if (total <= 1) return null;
  return (
    <div className="acts" style={{ marginTop: 12, alignItems: "center" }}>
      <Button
        variant="default"
        type="button"
        className="bt"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        Anterior
      </Button>
      <span className="sub">
        Página {page + 1} de {total}
      </span>
      <Button
        variant="default"
        type="button"
        className="bt"
        disabled={page + 1 >= total}
        onClick={() => onChange(page + 1)}
      >
        Próxima
      </Button>
    </div>
  );
}
