import createClient from "openapi-fetch";
import type { paths, components } from "./schema";

export type Schemas = components["schemas"];
/** Em testes aponta para uma URL absoluta (Node não resolve caminho relativo). */
const BASE = import.meta.env.VITE_API_BASE ?? "/api/v1";
const xsrf = () =>
  document.cookie
    .split("; ")
    .find((c) => c.startsWith("XSRF-TOKEN="))
    ?.split("=")[1] ?? "";

let refreshing: Promise<boolean> | null = null;
const renovar = () =>
  (refreshing ??= fetch(`${BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "X-XSRF-TOKEN": xsrf() },
  })
    .then((r) => r.ok)
    .finally(() => (refreshing = null)));

/** Envia XSRF nas escritas; em 401 renova uma única vez (compartilhada) e repete a chamada (CA-10). */
async function apiFetch(req: Request): Promise<Response> {
  const retry = req.clone();
  if (req.method !== "GET") req.headers.set("X-XSRF-TOKEN", xsrf());
  const res = await fetch(req);
  if (res.status !== 401 || req.url.includes("/auth/")) return res;
  if (await renovar()) {
    if (retry.method !== "GET") retry.headers.set("X-XSRF-TOKEN", xsrf());
    return fetch(retry);
  }
  window.dispatchEvent(new Event("sessao-expirada"));
  return res;
}

export const api = createClient<paths>({
  baseUrl: BASE,
  credentials: "include",
  fetch: apiFetch,
});

/** Lança o ProblemDetail (RFC 9457) em caso de erro, para uso com TanStack Query. */
export function ok<T>(r: { data?: T; error?: unknown }): T {
  if (r.error) throw r.error;
  return r.data as T;
}
export const msgErro = (e: unknown) => {
  const p = e as Schemas["ProblemDetail"];
  return (
    p?.campos_invalidos?.map((c) => `${c.campo}: ${c.mensagem}`).join("; ") ||
    p?.detail ||
    p?.title ||
    "Falha inesperada."
  );
};
