import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.tsx";
import Cadastro from "./pages/Cadastro.tsx";
import Tela_Projetos_Analista from "./pages/analista/Tela_Projetos.tsx";
import Tela_Projetos_Cliente from "./pages/cliente/Tela_Projetos.tsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/analista/projetos" element={<Tela_Projetos_Analista />} />
      <Route path="/cliente/projetos" element={<Tela_Projetos_Cliente />} />
      {/* Rotas legadas — mantêm compatibilidade */}
      <Route path="/Tela_Projetos" element={<Tela_Projetos_Analista />} />
      <Route path="/Tela_Itens" element={<Tela_Projetos_Analista />} />
    </Routes>
  );
}
