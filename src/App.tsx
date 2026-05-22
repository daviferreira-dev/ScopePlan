import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Login from "./pages/Login.tsx";
import Cadastro from "./pages/Cadastro.tsx";
import Tela_Projetos_Analista from "./pages/analista/Tela_Projetos.tsx";
import Tela_Projetos_Cliente from "./pages/cliente/Tela_Projetos.tsx";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      fontFamily: "'DM Sans', sans-serif",
      color: "#7a9982",
      flexDirection: "column",
      gap: 8
    }}>
      <h2 style={{ color: "#1a2e1f", opacity: 0.5 }}>{title}</h2>
      <p style={{ fontSize: 13 }}>Página em desenvolvimento.</p>
    </div>
  );
}

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

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

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
              <PlaceholderPage title="Painel do Desenvolvedor" />
            </ProtectedRoute>
          } />

          {/* Rotas do Gestor */}
          <Route path="/gestor/projetos" element={
            <ProtectedRoute allowedProfiles={['gestor']}>
              <PlaceholderPage title="Painel do Gestor" />
            </ProtectedRoute>
          } />

          {/* Rota de acesso negado */}
          <Route path="/acesso-negado" element={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 16 }}>
              <h1 style={{ color: "#b91c1c" }}>Acesso Negado</h1>
              <p style={{ color: "#7a9982" }}>Você não tem permissão para acessar esta página.</p>
              <a href="/" style={{ color: "#2d7a40" }}>Voltar para Home</a>
            </div>
          } />

          {/* Rotas legadas */}
          <Route path="/Tela_Projetos" element={<Navigate to="/analista/projetos" replace />} />
          <Route path="/Tela_Itens" element={<Navigate to="/analista/projetos" replace />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}
