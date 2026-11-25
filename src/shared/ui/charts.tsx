import { Dinheiro } from "./index";

export type Fatia = { nome: string; valor: number; cor: string; op?: number };
export const COR = { l: "var(--l)", t: "var(--t)", d: "var(--d)" };

/** Rosca do protótipo: texto central, legenda com valor e percentual. */
export function Donut({
  titulo,
  fatias,
  centro,
  sub,
}: {
  titulo: string;
  fatias: Fatia[];
  centro: string;
  sub: string;
}) {
  const total = fatias.reduce((s, f) => s + f.valor, 0) || 1;
  let off = 25;
  return (
    <div className="card">
      <h3>{titulo}</h3>
      <div className="dn">
        <svg
          viewBox="0 0 42 42"
          role="img"
          aria-label={`${titulo}: ${fatias.map((f) => `${f.nome} ${f.valor}`).join(", ")}`}
        >
          <circle
            cx="21"
            cy="21"
            r="15.9155"
            fill="none"
            style={{ stroke: "var(--bd)" }}
            strokeWidth="5"
          />
          {fatias.map((f) => {
            const k = (f.valor / total) * 100,
              o = off;
            off -= k;
            return (
              <circle
                key={f.nome}
                cx="21"
                cy="21"
                r="15.9155"
                fill="none"
                style={{ stroke: f.cor }}
                strokeOpacity={f.op ?? 1}
                strokeWidth="5"
                strokeDasharray={`${k} ${100 - k}`}
                strokeDashoffset={o}
              />
            );
          })}
          <text
            x="21"
            y="21.5"
            textAnchor="middle"
            fontSize="4.6"
            fontWeight="600"
            style={{ fill: "var(--tx)" }}
          >
            {centro}
          </text>
          <text x="21" y="26" textAnchor="middle" fontSize="2.6" style={{ fill: "var(--mut)" }}>
            {sub}
          </text>
        </svg>
        <ul className="lg">
          {fatias.map((f) => (
            <li key={f.nome}>
              <i style={{ background: f.cor, opacity: f.op ?? 1 }} />
              {f.nome}
              <br />
              <b>
                <Dinheiro v={f.valor} />
              </b>{" "}
              <span>{Math.round((f.valor / total) * 100)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
