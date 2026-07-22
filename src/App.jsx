import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Feedback from './pages/Feedback'
import GuideUtilisation from './pages/GuideUtilisation'
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
import BoutonFeedback from './components/BoutonFeedback'

function CompteInactif() {
  const { deconnexion, profil } = useAuth()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--fond)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--blanc)', border: '1px solid var(--bordure)', borderRadius: 16, padding: 36, maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 14 }}>⏳</div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Compte en attente de validation</div>
        <div style={{ fontSize: 13, color: 'var(--texte-sec)', lineHeight: 1.6, marginBottom: 20 }}>
          Bonjour {profil?.prenom || ''} ! Votre compte doit être activé par un administrateur avant de pouvoir accéder à l'application.
        </div>
        <button className="btn-cancel" onClick={deconnexion} style={{ width: '100%' }}>Se déconnecter</button>
      </div>
    </div>
  )
}

function RoutesProtegees() {
  const { user, loading, compteActif, isAssocie } = useAuth()

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 14 }}>
      Chargement...
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
  if (!compteActif) return <CompteInactif />

  return (
    <>
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/guide" element={<GuideUtilisation />} />
        {isAssocie && <Route path="/admin" element={<Admin />} />}
        {isAssocie && <Route path="/feedback" element={<Feedback />} />}
        <Route path="/projet/:id" element={<EcranProjet />} />
        <Route path="/projet/:id/collaborateurs" element={<Collaborateurs />} />
        <Route path="/projet/:id/collaborateurs/:cid" element={<FicheCollaborateur />} />
        <Route path="/projet/:id/contacts/:cid" element={<FicheContact />} />
        <Route path="/projet/:id/controles" element={<Controles />} />
        <Route path="/projet/:id/controles/nouveau" element={<FicheControle />} />
        <Route path="/projet/:id/controles/:cid" element={<FicheControle />} />
        <Route path="/projet/:id/checklists" element={<Checklists />} />
        <Route path="/projet/:id/guides" element={<Guides />} />
        <Route path="/projet/:id/guides/:gid" element={<FicheGuide />} />
        <Route path="/projet/:id/points" element={<Points />} />
        <Route path="/projet/:id/points/nouveau" element={<FichePoint />} />
        <Route path="/projet/:id/points/:pid" element={<FichePoint />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BoutonFeedback />
    </>
  )
}

function LoginRoute() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/*" element={<RoutesProtegees />} />
      </Routes>
    </AuthProvider>
  )
}
