import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login.tsx'
import Cadastro from './pages/Cadastro.tsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
    </Routes>
  )
}
