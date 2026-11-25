/**
 * Converte o texto de um campo numérico em número finito.
 * Campo vazio, inválido ou `undefined` nunca produz `NaN` (D39/RF-WEB-04).
 */
export function numero(v: unknown, padrao = 0): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : padrao;
  if (typeof v !== "string" || !v.trim()) return padrao;
  const n = Number(v.trim().replace(",", "."));
  return Number.isFinite(n) ? n : padrao;
}

/** Id/número opcional: devolve `null` para campos vazios ou inválidos. */
export function numeroOuNulo(v: unknown): number | null {
  const n = numero(v, Number.NaN);
  return Number.isFinite(n) ? n : null;
}
