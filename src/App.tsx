import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.tsx";
import Cadastro from "./pages/Cadastro.tsx";
import Tela_Projetos from "./pages/Tela_Projetos.tsx";
import Tela_Itens from "./pages/Tela_Itens.tsx";
import ValidacaoRequisitos from "./pages/ValidacaoRequisitos.tsx";
import DownloadERS from "./pages/DownloadERS.tsx";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route
        path="/projetos"
        element={
          <ProtectedRoute>
            <Tela_Projetos />
          </ProtectedRoute>
        }
      />
      {/* Redirect old route names */}
      <Route path="/Tela_Projetos" element={<Navigate to="/projetos" replace />} />
      <Route path="/Tela_Itens" element={<Navigate to="/projetos" replace />} />
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}