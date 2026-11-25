import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "../features/auth/LoginPage";
import { TrocarSenhaPage } from "../features/auth/TrocarSenhaPage";
import { useSession } from "../features/auth/session";
import { ClientesPage, useClientesCfg } from "../features/clientes/ClientesPage";
import { ContratoDetalhePage } from "../features/contratos/ContratoDetalhePage";
import { ContratoFormPage } from "../features/contratos/ContratoFormPage";
import { ContratosPage } from "../features/contratos/ContratosPage";
import { CooperadosPage, cooperadosCfg } from "../features/cooperados/CooperadosPage";
import { DespesaFormPage } from "../features/despesas/DespesaFormPage";
import { DespesasPage } from "../features/despesas/DespesasPage";
import { PagamentosPage } from "../features/pagamentos/PagamentosPage";
import { PainelPage } from "../features/painel/PainelPage";
import { RelatoriosPage } from "../features/relatorios/RelatoriosPage";
import { UsuariosPage, usuariosCfg } from "../features/usuarios/UsuariosPage";
import { CadastroForm } from "../shared/ui/cadastro";
import { Layout } from "./Layout";

const ClienteForm = () => <CadastroForm cfg={useClientesCfg()} />;

export function App() {
  const { user, loading } = useSession();
  if (loading) return null;
  if (!user) return <LoginPage />;
  if (user.deve_trocar_senha) return <TrocarSenhaPage />;
  const papel = user.papel,
    adm = papel === "ADMINISTRADOR",
    fin = papel === "FINANCEIRO",
    mot = papel === "MOTORISTA";
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<PainelPage />} />
        {adm && (
          <>
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route path="/usuarios/novo" element={<CadastroForm cfg={usuariosCfg} />} />
            <Route path="/usuarios/:id/editar" element={<CadastroForm cfg={usuariosCfg} />} />
          </>
        )}
        {(adm || fin) && <Route path="/cooperados" element={<CooperadosPage />} />}
        {adm && (
          <>
            <Route path="/cooperados/novo" element={<CadastroForm cfg={cooperadosCfg} />} />
            <Route path="/cooperados/:id/editar" element={<CadastroForm cfg={cooperadosCfg} />} />
          </>
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
        {adm && (
          <>
            <Route path="/clientes/novo" element={<ClienteForm />} />
            <Route path="/clientes/:id/editar" element={<ClienteForm />} />
          </>
        )}
        {(adm || mot) && (
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
    </Layout>
  );
}
