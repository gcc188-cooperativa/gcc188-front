import { Button, Group, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useState } from "react";

export type CfgConfirmar = {
  titulo: string;
  mensagem?: string;
  perigo?: boolean;
  campo?: { rotulo: string; tipo?: string };
  aoConfirmar: (texto: string) => void | Promise<void>;
};

/** Confirmação de ações irreversíveis (RF-WEB-10) usando @mantine/modals. */
export function confirmar(c: CfgConfirmar) {
  modals.open({
    title: c.titulo,
    centered: true,
    children: <Confirmacao cfg={c} />,
  });
}

function Confirmacao({ cfg }: { cfg: CfgConfirmar }) {
  const [txt, setTxt] = useState("");
  const fechar = () => modals.closeAll();
  const confirmarAcao = () => {
    fechar();
    void cfg.aoConfirmar(txt.trim());
  };
  return (
    <Stack gap="md">
      <Text c="dimmed">{cfg.mensagem ?? "Esta ação não pode ser desfeita. Deseja continuar?"}</Text>
      {cfg.campo &&
        (cfg.campo.tipo === "password" ? (
          <PasswordInput
            label={cfg.campo.rotulo}
            value={txt}
            onChange={(e) => setTxt(e.currentTarget.value)}
            visibilityToggleButtonProps={{ "aria-label": "Mostrar" }}
          />
        ) : (
          <TextInput
            label={cfg.campo.rotulo}
            value={txt}
            onChange={(e) => setTxt(e.currentTarget.value)}
          />
        ))}
      <Group justify="flex-end">
        <Button variant="default" onClick={fechar}>
          Voltar
        </Button>
        <Button
          color={cfg.perigo ? "red" : "teal"}
          disabled={!!cfg.campo && !txt.trim()}
          onClick={confirmarAcao}
        >
          Confirmar
        </Button>
      </Group>
    </Stack>
  );
}
