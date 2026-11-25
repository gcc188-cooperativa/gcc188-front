import { ActionIcon, Button, Group, Menu } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Icone } from "./icons";

export type Acao = { rotulo: string; perigo?: boolean; fazer: () => void };
/** Botão dividido: a primeira ação fica visível; as demais, no menu (Mantine Menu). */
export function Acoes({ acoes, grande = false }: { acoes: Acao[]; grande?: boolean }) {
  const [aberto, { open, close }] = useDisclosure(false);
  const n = acoes.length;
  const perigo = n > 0 && !!acoes[0].perigo;
  return (
    <Group gap={0} wrap="nowrap">
      <Button
        variant={perigo ? "outline" : grande ? "filled" : "light"}
        color={perigo ? "red" : "teal"}
        size={grande ? "md" : "xs"}
        disabled={!n}
        onClick={() => {
          close();
          acoes[0]?.fazer();
        }}
      >
        {n ? acoes[0].rotulo : "Sem ações"}
      </Button>
      <Menu
        opened={aberto}
        onChange={(o) => (o ? open() : close())}
        position="bottom-end"
        withArrow
      >
        <Menu.Target>
          <ActionIcon
            variant="default"
            size={grande ? "md" : "xs"}
            disabled={!n}
            aria-haspopup="menu"
            aria-expanded={aberto}
            aria-label="Escolher outra ação"
            title="Escolher outra ação"
          >
            <Icone n="chevL" girar />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          {acoes.map((a) => (
            <Menu.Item
              key={a.rotulo}
              color={a.perigo ? "red" : undefined}
              onClick={() => {
                close();
                a.fazer();
              }}
            >
              {a.rotulo}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
