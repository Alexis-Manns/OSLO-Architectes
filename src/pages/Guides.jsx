import React, { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Topbar from '../components/Topbar'

const GUIDES = {
  'Normes / DTU': [
    { id: '1', titre: 'DTU 20.1 — Maçonnerie', categorie: 'Normes / DTU', maj: true },
    { id: '2', titre: 'DTU 45.1 — Isolation par l\'extérieur', categorie: 'Normes / DTU', maj: false },
    { id: '3', titre: 'RE 2020 — Réglementation thermique', categorie: 'Normes / DTU', maj: false },
  ],
  'Guides internes': [
    { id: '4', titre: 'Procédure visa plans EXE', categorie: 'Guides internes', maj: false },
    { id: '5', titre: 'Checklist OPR Oslo', categorie: 'Guides internes', maj: true },
  ],
  'Modèles courriers': [
    { id: '6', titre: 'Mise en demeure entreprise', categorie: 'Modèles courriers', maj: false },
    { id: '7', titre: 'Compte-rendu de chantier', categorie: 'Modèles courriers', maj: false },
  ],
}

const ICONES = { 'Normes / DTU': '📄', 'Guides internes': '📗', 'Modèles courriers': '✉️' }
const COLORS = {
  'Normes / DTU':    { bg: '#E6F1FB', color: '#185FA5' },
  'Guides internes': { bg: '#EAF3DE', color: '#3B6D11' },
  'Modèles courriers': { bg: '#FAEEDA', color: '#854F0B' },
}

export default function Guides() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }
  const [onglet, setOnglet] = useState('Normes / DTU')

  const c = COLORS[onglet] || {}

  return (
    <div className="page">
      <Topbar
        breadcrumb={[
          { label: 'Mes projets', path: '/' },
          { label: projet.nom, path: `/projet/${id}` },
          { label: 'Guides et procédures' },
        ]}
        phase={projet.phase}
      />
      <div className="content">
        <div className="tabs">
          {Object.keys(GUIDES).map(tab => (
            <button key={tab} className={`tab-btn ${onglet === tab ? 'active' : ''}`} onClick={() => setOnglet(tab)}>
              {tab}
            </button>
          ))}
        </div>
        {(GUIDES[onglet] || []).map(g => (
          <div key={g.id} className="list-item"
            onClick={() => navigate(`/projet/${id}/guides/${g.id}`, { state: { projet, guide: g } })}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              {ICONES[onglet]}
            </div>
            <div className="item-info">
              <div className="item-nom">{g.titre}</div>
              <div className="item-sub">{g.categorie}</div>
            </div>
            {g.maj && <span className="badge badge-orange" style={{ fontSize: 10 }}>MAJ</span>}
            <span className="arrow">›</span>
          </div>
        ))}
        <button className="btn-add">+ Ajouter un document</button>
      </div>
    </div>
  )
}
