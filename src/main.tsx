import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { SessionProvider } from "./features/auth/session";
import { TemaProvider } from "./app/Providers";

const qc = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

async function iniciar() {
  // `npm run dev:mock`: API simulada por MSW (login com adm@, fin@, mot@, cli@ ou novo@coop.example / senha-correta-123).
  if (import.meta.env.VITE_MOCK)
    await (await import("./mocks/browser")).worker.start({ onUnhandledRequest: "bypass" });
  createRoot(document.getElementById("root")!).render(
    <TemaProvider>
      <QueryClientProvider client={qc}>
        <BrowserRouter>
          <SessionProvider>
            <App />
          </SessionProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </TemaProvider>,
  );
}
iniciar();
