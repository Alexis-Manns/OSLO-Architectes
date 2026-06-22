import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Accueil from './pages/Accueil'
import EcranProjet from './pages/EcranProjet'
import Collaborateurs from './pages/Collaborateurs'
import Controles from './pages/Controles'
import FicheControle from './pages/FicheControle'
import Checklists from './pages/Checklists'
import Guides from './pages/Guides'
import Points from './pages/Points'
import FichePoint from './pages/FichePoint'
import { FicheCollaborateur, FicheContact, FicheGuide } from './pages/Fiches'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Accueil />} />
      <Route path="/projet/:id" element={<EcranProjet />} />
      <Route path="/projet/:id/collaborateurs" element={<Collaborateurs />} />
      <Route path="/projet/:id/collaborateurs/:cid" element={<FicheCollaborateur />} />
      <Route path="/projet/:id/contacts/:cid" element={<FicheContact />} />
      <Route path="/projet/:id/controles" element={<Controles />} />
      <Route path="/projet/:id/controles/:cid" element={<FicheControle />} />
      <Route path="/projet/:id/checklists" element={<Checklists />} />
      <Route path="/projet/:id/guides" element={<Guides />} />
      <Route path="/projet/:id/guides/:gid" element={<FicheGuide />} />
      <Route path="/projet/:id/points" element={<Points />} />
      <Route path="/projet/:id/points/:pid" element={<FichePoint />} />
    </Routes>
  )
}
