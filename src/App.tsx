import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login.tsx'
import Cadastro from './pages/Cadastro.tsx'
import Tela_Projetos from './pages/Tela_Projetos.tsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/Tela_Projetos" element={<Tela_Projetos />} />
    </Routes>
  )
}
