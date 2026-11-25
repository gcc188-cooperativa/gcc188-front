import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render as renderTesting, type RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { theme } from "../app/theme";
import { SessionProvider, useSession } from "../features/auth/session";

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

/** `render` com os provedores do Mantine para componentes isolados. */
export function render(ui: React.ReactNode, options?: RenderOptions) {
  return renderTesting(
    <MantineProvider theme={theme} defaultColorScheme="light">
      <ModalsProvider>
        <Notifications />
        {ui}
      </ModalsProvider>
    </MantineProvider>,
    options,
  );
}

/** Renderiza com os mesmos provedores da aplicação; `como` simula usuário autenticado (MSW). */
export function renderApp(
  ui: React.ReactNode,
  { como, rota = "/", porta = true }: { como?: number; rota?: string; porta?: boolean } = {},
) {
  if (como) sessionStorage.setItem("mock-user", String(como));
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderTesting(
    <MantineProvider theme={theme} defaultColorScheme="light">
      <ModalsProvider>
        <Notifications />
        <QueryClientProvider client={qc}>
          <MemoryRouter initialEntries={[rota]}>
            <SessionProvider>{porta ? <Porta>{ui}</Porta> : ui}</SessionProvider>
          </MemoryRouter>
        </QueryClientProvider>
      </ModalsProvider>
    </MantineProvider>,
  );
}
