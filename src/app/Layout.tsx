import {
  ActionIcon,
  AppShell,
  Burger,
  Button,
  Group,
  NavLink,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlterarSenhaModal } from "../features/auth/AlterarSenhaModal";
import { useSession } from "../features/auth/session";
import { MENU } from "../shared/permissions";
import { PAPEL } from "../shared/ui";
import { Icone } from "../shared/ui/icons";
import { Logo } from "../shared/ui/Logo";

/** Cabeçalho: identidade, tema, troca de senha e logout. */
function Cabecalho({
  mobileOpened,
  onToggleMobile,
}: {
  mobileOpened: boolean;
  onToggleMobile: () => void;
}) {
  const { user, logout } = useSession();
  const [senha, { open: abrirSenha, close: fecharSenha }] = useDisclosure(false);
  const { toggleColorScheme } = useMantineColorScheme();
  const alternarTema = () => {
    toggleColorScheme();
    const r = document.documentElement;
    r.setAttribute("data-theme", r.getAttribute("data-theme") === "dark" ? "light" : "dark");
  };
  return (
    <>
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <Burger opened={mobileOpened} onClick={onToggleMobile} size="sm" hiddenFrom="sm" />
            <Logo compact />
            <Text size="sm" c="dimmed" visibleFrom="xs">
              {user!.nome} · {PAPEL[user!.papel]}
            </Text>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <Button size="xs" variant="default" onClick={alternarTema}>
              Claro/escuro
            </Button>
            <Button size="xs" variant="default" onClick={abrirSenha}>
              Alterar senha
            </Button>
            <Button size="xs" color="red" variant="light" onClick={logout}>
              Sair
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      {senha && <AlterarSenhaModal onClose={fecharSenha} />}
    </>
  );
}

/** Menu lateral filtrado pelo papel e recolhível. */
function MenuLateral({ mini, onToggleMini }: { mini: boolean; onToggleMini: () => void }) {
  const { user } = useSession();
  const { pathname } = useLocation();
  const ativo = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const menu = MENU.filter((m) => m.papeis.includes(user!.papel) && m.to !== "/");
  return (
    <AppShell.Navbar p="xs">
      <Group justify="space-between" mb="xs" wrap="nowrap">
        {!mini && <Logo />}
        <ActionIcon
          variant="subtle"
          onClick={onToggleMini}
          aria-label={mini ? "Expandir menu" : "Recolher menu"}
          title={mini ? "Expandir menu" : "Recolher menu"}
        >
          <Icone n="chevL" girar={mini} />
        </ActionIcon>
      </Group>
      <NavLink
        component={Link}
        to="/"
        label="Painel"
        leftSection={<Icone n="home" />}
        active={ativo("/")}
        aria-current={ativo("/") ? "page" : undefined}
        title="Painel"
        mb={2}
      />
      {menu.map((m) => (
        <NavLink
          key={m.to}
          component={Link}
          to={m.to}
          label={mini ? undefined : m.label}
          leftSection={<Icone n={m.icone} />}
          active={ativo(m.to)}
          aria-current={ativo(m.to) ? "page" : undefined}
          title={m.label}
          mb={2}
        />
      ))}
    </AppShell.Navbar>
  );
}

/** Estrutura da SPA: cabeçalho, menu lateral recolhível e conteúdo (Mantine AppShell). */
export function Layout({ children }: { children: ReactNode }) {
  const [mini, setMini] = useLocalStorage({ key: "mini", defaultValue: false });
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure(false);
  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: mini ? 84 : 230,
        breakpoint: "sm",
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
    >
      <Cabecalho mobileOpened={mobileOpened} onToggleMobile={toggleMobile} />
      <MenuLateral mini={mini} onToggleMini={() => setMini(!mini)} />
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
