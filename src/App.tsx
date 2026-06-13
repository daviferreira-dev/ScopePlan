import { Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import ResetSenha from "./pages/ResetSenha";
import Tela_Projetos_Analista from "./pages/analista/Tela_Projetos";
import Tela_Projetos_Cliente from "./pages/cliente/Tela_Projetos";
import Tela_Projetos_Gestor from "./pages/gestor/Tela_Projetos";
import Tela_Projetos_Dev from "./pages/desenvolvedor/Tela_Projetos";
import AceitarConvite from "./pages/AceitarConvite";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedProfiles: string[];
}

function ProtectedRoute({ children, allowedProfiles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p>Carregando...</p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!allowedProfiles.includes(user.perfil)) {
    return <Navigate to="/acesso-negado" replace />;
  }
  return <>{children}</>;
}

function NotFound() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 16, fontFamily: "'Sora', sans-serif" }}>
      <h1 style={{ color: "#1a2e1f", fontSize: 48 }}>404</h1>
      <p style={{ color: "#5a7a62" }}>Página não encontrada.</p>
      <Link to="/" style={{ color: "#2d7a40", textDecoration: "underline" }}>Voltar para Home</Link>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/reset-senha" element={<ResetSenha />} />

          {/* Rotas do Analista */}
          <Route path="/analista/projetos" element={
            <ProtectedRoute allowedProfiles={['analista']}>
              <Tela_Projetos_Analista />
            </ProtectedRoute>
          } />

          {/* Rotas do Cliente */}
          <Route path="/cliente/projetos" element={
            <ProtectedRoute allowedProfiles={['cliente']}>
              <Tela_Projetos_Cliente />
            </ProtectedRoute>
          } />

          {/* Rotas do Desenvolvedor */}
          <Route path="/desenvolvedor/projetos" element={
            <ProtectedRoute allowedProfiles={['desenvolvedor']}>
              <Tela_Projetos_Dev />
            </ProtectedRoute>
          } />

          {/* Rotas do Gestor */}
          <Route path="/gestor/projetos" element={
            <ProtectedRoute allowedProfiles={['gestor']}>
              <Tela_Projetos_Gestor />
            </ProtectedRoute>
          } />

          {/* Rota de acesso negado */}
          <Route path="/acesso-negado" element={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 16, fontFamily: "'Sora', sans-serif" }}>
              <h1 style={{ color: "#b91c1c" }}>Acesso Negado</h1>
              <p style={{ color: "#7a9982" }}>Você não tem permissão para acessar esta página.</p>
              <Link to="/" style={{ color: "#2d7a40", textDecoration: "underline" }}>Voltar para Home</Link>
            </div>
          } />

          {/* Convite — público, não precisa de auth */}
          <Route path="/convite/:token" element={<AceitarConvite />} />

          {/* Rotas legadas */}
          <Route path="/Tela_Projetos" element={<Navigate to="/analista/projetos" replace />} />
          <Route path="/Tela_Itens" element={<Navigate to="/analista/projetos" replace />} />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}
