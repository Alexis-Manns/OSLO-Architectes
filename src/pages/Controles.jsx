import React, { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Topbar from '../components/Topbar'

const DEMO_CONTROLES = [
  { id: '1', titre: 'Contrôle étanchéité toiture', resultat: 'Conforme',      realise_par: 'MOE',        type: 'Total',          date: '12/05/2026', maj: false, photos: [] },
  { id: '2', titre: 'Contrôle isolation façade — Bât. A', resultat: 'Non conforme', realise_par: 'Entreprise', type: 'Échantillonnage', date: '20/05/2026', maj: true,  photos: [] },
  { id: '3', titre: 'Contrôle menuiseries ext. — R+2',    resultat: 'Sous réserves', realise_par: 'MOE',        type: 'Échantillonnage', date: '25/05/2026', maj: false, photos: [] },
]

const BADGE_RESULTAT = {
  'Conforme':      { bg: '#EAF3DE', color: '#3B6D11' },
  'Sous réserves': { bg: '#FAEEDA', color: '#854F0B' },
  'Non conforme':  { bg: '#FCEBEB', color: '#A32D2D' },
}
const BADGE_REAL = {
  'MOE':        { bg: '#EEEDFE', color: '#534AB7' },
  'Entreprise': { bg: '#FAECE7', color: '#993C1D' },
}

export default function Controles() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }
  const [controles] = useState(DEMO_CONTROLES)

  return (
    <div className="page">
      <Topbar
        breadcrumb={[
          { label: 'Mes projets', path: '/' },
          { label: projet.nom, path: `/projet/${id}` },
          { label: 'Contrôles Qualité' },
        ]}
        phase={projet.phase}
      />
      <div className="content">
        {controles.map(c => {
          const br = BADGE_RESULTAT[c.resultat] || {}
          const bl = BADGE_REAL[c.realise_par] || {}
          return (
            <div key={c.id} className="list-item" style={{ alignItems: 'flex-start', padding: '12px' }}
              onClick={() => navigate(`/projet/${id}/controles/${c.id}`, { state: { projet, controle: c } })}>
              <div className="item-info">
                <div className="item-nom">{c.titre}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  <span className="badge" style={{ background: br.bg, color: br.color }}>{c.resultat}</span>
                  <span className="badge" style={{ background: bl.bg, color: bl.color }}>{c.realise_par}</span>
                  <span className="badge badge-gris">{c.type}</span>
                </div>
                <div className="item-sub" style={{ marginTop: 4 }}>{c.date}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {c.maj && <span className="badge badge-orange" style={{ fontSize: 10 }}>MAJ</span>}
                <span className="arrow">›</span>
              </div>
            </div>
          )
        })}
        <button className="btn-add">+ Nouveau contrôle</button>
      </div>
    </div>
  )
}
