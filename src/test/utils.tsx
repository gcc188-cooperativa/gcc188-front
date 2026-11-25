import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SessionProvider, useSession } from "../features/auth/session";
import { TemaProvider } from "../app/Providers";

/** Espera a sessão carregar para páginas que assumem usuário autenticado. */
function Porta({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  return loading || !user ? null : <>{children}</>;
}
export const ADM = 1,
  FIN = 2,
  MOT = 3,
  CLI = 4,
  NOVO = 5;
/** Renderiza com todos os provedores; `como` simula o usuário já autenticado (API simulada por MSW). */
export function renderApp(
  ui: React.ReactNode,
  { como, rota = "/", porta = true }: { como?: number; rota?: string; porta?: boolean } = {},
) {
  if (como) sessionStorage.setItem("mock-user", String(como));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <TemaProvider>
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[rota]}>
          <SessionProvider>{porta ? <Porta>{ui}</Porta> : ui}</SessionProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </TemaProvider>,
  );
}
