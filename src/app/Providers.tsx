import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import type { ReactNode } from "react";
import { resolver, theme } from "./theme";

/** Mantine com o tema do protótipo; modais de confirmação e avisos (toast) ficam aqui. */
export function TemaProvider({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} cssVariablesResolver={resolver} defaultColorScheme="auto">
      <ModalsProvider>
        <Notifications position="bottom-center" limit={1} zIndex={400} />
        {children}
      </ModalsProvider>
    </MantineProvider>
  );
}
