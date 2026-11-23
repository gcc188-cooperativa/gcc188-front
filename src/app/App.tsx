import { AppShell, Burger, Button, Group, Menu, NavLink, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AlterarSenhaModal } from "../features/auth/AlterarSenhaModal";
import { LoginPage } from "../features/auth/LoginPage";
import { TrocarSenhaPage } from "../features/auth/TrocarSenhaPage";
import { useSession } from "../features/auth/session";
import { ClientesPage } from "../features/clientes/ClientesPage";
import { ContratoDetalhePage } from "../features/contratos/ContratoDetalhePage";
import { ContratoFormPage } from "../features/contratos/ContratoFormPage";
import { ContratosPage } from "../features/contratos/ContratosPage";
import { CooperadosPage } from "../features/cooperados/CooperadosPage";
import { DespesaFormPage } from "../features/despesas/DespesaFormPage";
import { DespesasPage } from "../features/despesas/DespesasPage";
import { PagamentosPage } from "../features/pagamentos/PagamentosPage";
import { PainelPage } from "../features/painel/PainelPage";
import { RelatoriosPage } from "../features/relatorios/RelatoriosPage";
import { UsuariosPage } from "../features/usuarios/UsuariosPage";
import { MENU } from "../shared/permissions";

export function App() {
  const { user, loading, logout } = useSession();
  const [open, { toggle }] = useDisclosure();
  const [senha, setSenha] = useState(false);
  const { pathname } = useLocation();
  if (loading) return null;
  if (!user) return <LoginPage />;
  if (user.deve_trocar_senha) return <TrocarSenhaPage />;
  const papel = user.papel;
  const menu = MENU.filter((m) => m.papeis.includes(papel));
  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: "sm", collapsed: { mobile: !open } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={open}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label="Abrir menu"
            />
            <Text fw={700}>Cooperativa</Text>
          </Group>
          <Menu position="bottom-end">
            <Menu.Target>
              <Button variant="default" size="xs">
                {user.nome} · {papel.toLowerCase()}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => setSenha(true)}>Alterar senha</Menu.Item>
              <Menu.Item onClick={logout}>Sair</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="xs">
        {menu.map((m) => (
          <NavLink
            key={m.to}
            component={Link}
            to={m.to}
            label={m.label}
            active={m.to === "/" ? pathname === "/" : pathname.startsWith(m.to)}
            onClick={toggle}
          />
        ))}
      </AppShell.Navbar>
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<PainelPage />} />
          {papel === "ADMINISTRADOR" && <Route path="/usuarios" element={<UsuariosPage />} />}
          {["ADMINISTRADOR", "FINANCEIRO"].includes(papel) && (
            <Route path="/cooperados" element={<CooperadosPage />} />
          )}
          {papel !== "CLIENTE" && (
            <>
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/despesas" element={<DespesasPage />} />
              <Route path="/despesas/nova" element={<DespesaFormPage />} />
              <Route path="/despesas/:id/editar" element={<DespesaFormPage />} />
              <Route path="/relatorios" element={<RelatoriosPage />} />
            </>
          )}
          {["ADMINISTRADOR", "MOTORISTA"].includes(papel) && (
            <>
              <Route path="/contratos/novo" element={<ContratoFormPage />} />
              <Route path="/contratos/:id/editar" element={<ContratoFormPage />} />
            </>
          )}
          <Route path="/contratos" element={<ContratosPage />} />
          <Route path="/contratos/:id" element={<ContratoDetalhePage />} />
          <Route path="/pagamentos" element={<PagamentosPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppShell.Main>
      <AlterarSenhaModal opened={senha} onClose={() => setSenha(false)} />
    </AppShell>
  );
}
