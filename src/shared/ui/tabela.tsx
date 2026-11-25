import { NativeSelect } from "@mantine/core";
import { useState, type ReactNode } from "react";

export type Col<T> = { t: string; r: (x: T) => ReactNode; o?: (x: T) => string | number };
const cmp = (x: string | number, y: string | number) =>
  typeof x === "number" && typeof y === "number"
    ? x - y
    : String(x).localeCompare(String(y), "pt-BR", { numeric: true, sensitivity: "base" });

/** Tabela ordenável (clique no cabeçalho ou seletor no celular); em telas estreitas vira cartões. */
export function Tabela<T>({
  cols,
  rows,
  k,
}: {
  cols: Col<T>[];
  rows: T[];
  k: (x: T) => string | number;
}) {
  const [ord, setOrd] = useState<{ i: number; d: 1 | -1 } | null>(null);
  const f = ord ? cols[ord.i]?.o : undefined;
  const lista = ord && f ? [...rows].sort((a, b) => cmp(f(a), f(b)) * ord.d) : rows;
  const clicar = (i: number) => setOrd(ord?.i === i ? { i, d: ord.d === 1 ? -1 : 1 } : { i, d: 1 });
  return (
    <div className="card tw">
      <div className="srt">
        <label>
          Ordenar por
          <NativeSelect
            value={ord ? `${ord.i}:${ord.d}` : ""}
            onChange={(e) => {
              const [i, d] = e.target.value.split(":").map(Number);
              setOrd(e.target.value ? { i, d: d as 1 | -1 } : null);
            }}
          >
            <option value="">Escolha uma coluna</option>
            {cols.map(
              (c, i) =>
                c.o && [
                  <option key={`${i}a`} value={`${i}:1`}>
                    {c.t} (crescente)
                  </option>,
                  <option key={`${i}d`} value={`${i}:-1`}>
                    {c.t} (decrescente)
                  </option>,
                ],
            )}
          </NativeSelect>
        </label>
      </div>
      <table>
        <thead>
          <tr>
            {cols.map((c, i) =>
              c.o ? (
                <th
                  key={c.t}
                  aria-sort={ord?.i === i ? (ord.d === 1 ? "ascending" : "descending") : "none"}
                >
                  <button type="button" className="sb" onClick={() => clicar(i)}>
                    {c.t}
                    <svg className="sa" viewBox="0 0 24 24" aria-hidden="true">
                      <path className="u" d="M8 19V5M4.5 8.5L8 5l3.5 3.5" />
                      <path className="dw" d="M16 5v14M12.5 15.5L16 19l3.5-3.5" />
                    </svg>
                  </button>
                </th>
              ) : (
                <th key={c.t}>{c.t}</th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {lista.map((r) => (
            <tr key={k(r)}>
              {cols.map((c) => (
                <td key={c.t} data-l={c.t}>
                  {c.r(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
