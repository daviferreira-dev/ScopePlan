import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login.tsx'
import Cadastro from './pages/Cadastro.tsx'
import Tela_Projetos from './pages/Tela_Projetos.tsx'
import Tela_Itens from './pages/Tela_Itens.tsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/Tela_Projetos" element={<Tela_Projetos />} />
      <Route path="/Tela_Itens" element={<Tela_Itens />} />
    </Routes>
  )
}
