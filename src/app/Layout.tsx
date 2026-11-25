import { ActionIcon, Button, useComputedColorScheme, useMantineColorScheme } from "@mantine/core";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlterarSenhaModal } from "../features/auth/AlterarSenhaModal";
import { useSession } from "../features/auth/session";
import { MENU } from "../shared/permissions";
import { PAPEL } from "../shared/ui";
import { Icone } from "../shared/ui/icons";

/** Estrutura do protótipo: barra superior, menu lateral recolhível (ícones no tablet, barra inferior no celular) e conteúdo. */
export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useSession();
  const [mini, setMini] = useLocalStorage({ key: "mini", defaultValue: false });
  const [senha, { open, close }] = useDisclosure(false);
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const atual = useComputedColorScheme("light");
  const { pathname } = useLocation();
  // Os tokens do protótipo reagem a data-theme; em "auto" o atributo sai e vale prefers-color-scheme.
  useEffect(() => {
    const r = document.documentElement;
    if (colorScheme === "auto") r.removeAttribute("data-theme");
    else r.setAttribute("data-theme", colorScheme);
  }, [colorScheme]);
  const menu = MENU.filter((m) => m.papeis.includes(user!.papel));
  const ativo = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  const rotuloMenu = mini ? "Expandir menu" : "Recolher menu";
  return (
    <>
      <div className="top">
        <span>
          Entrou como {user!.nome} · {PAPEL[user!.papel]}
        </span>
        <Button
          variant="default"
          className="bt"
          onClick={() => setColorScheme(atual === "dark" ? "light" : "dark")}
        >
          Claro/escuro
        </Button>
        <Button variant="default" className="bt" onClick={open}>
          Alterar senha
        </Button>
        <Button variant="default" className="bt" onClick={logout}>
          Sair
        </Button>
      </div>
      <div className={`app${mini ? " mini" : ""}`}>
        <aside className="side">
          <div className="sh">
            <p className="logo">Cooperativa</p>
            <ActionIcon
              variant="default"
              className="cl"
              aria-controls="nav"
              aria-expanded={!mini}
              aria-label={rotuloMenu}
              title={rotuloMenu}
              onClick={() => setMini(!mini)}
            >
              <Icone n="chevL" />
            </ActionIcon>
          </div>
          <nav className="nav" id="nav" aria-label="Menu principal">
            {menu.map((m) => (
              <Link
                key={m.to}
                to={m.to}
                className={ativo(m.to) ? "on" : ""}
                aria-current={ativo(m.to) ? "page" : undefined}
                title={m.label}
              >
                <Icone n={m.icone} />
                <span className="lb">{m.label}</span>
              </Link>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
      <AlterarSenhaModal opened={senha} onClose={close} />
    </>
  );
}
