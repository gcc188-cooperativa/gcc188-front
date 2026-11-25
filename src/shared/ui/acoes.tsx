import { Button, Menu } from "@mantine/core";

export type Acao = { rotulo: string; perigo?: boolean; fazer: () => void };
/** Botão dividido do protótipo: a primeira ação fica visível; as demais, no menu do Mantine. */
export function Acoes({ acoes, grande = false }: { acoes: Acao[]; grande?: boolean }) {
  const n = acoes.length,
    d0 = n > 0 && !!acoes[0].perigo;
  return (
    <div className="sp">
      <Button
        variant="default"
        className={`bt${d0 ? " danger" : grande && n ? " pri" : ""}`}
        disabled={!n}
        onClick={() => acoes[0]?.fazer()}
      >
        {n ? acoes[0].rotulo : "Sem ações"}
      </Button>
      <Menu
        position="bottom-end"
        shadow="md"
        disabled={!n}
        classNames={{ dropdown: "mn-dd", item: "mn-i" }}
      >
        <Menu.Target>
          <Button
            variant="default"
            className={`bt cv${grande && n && !d0 ? " pri" : ""}`}
            disabled={!n}
            aria-label="Escolher outra ação"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </Button>
        </Menu.Target>
        <Menu.Dropdown>
          {acoes.map((a) => (
            <Menu.Item key={a.rotulo} className={a.perigo ? "dg" : undefined} onClick={a.fazer}>
              {a.rotulo}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </div>
  );
}
