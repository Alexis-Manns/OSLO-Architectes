import React, { useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import Topbar from '../components/Topbar'

const TUILES = [
  { nom: 'Collaborateurs',      icone: '👥', sousTitre: 'Équipe et intervenants',    bg: '#EEEDFE', color: '#534AB7', badgeTxt: '8 membres',      badgeBg: '#EEEDFE', badgeColor: '#534AB7', route: 'collaborateurs' },
  { nom: 'Contrôles Qualité',   icone: '✅', sousTitre: 'Suivi des vérifications',   bg: '#EAF3DE', color: '#3B6D11', badgeTxt: '1 non conforme',  badgeBg: '#FCEBEB', badgeColor: '#A32D2D', route: 'controles' },
  { nom: 'Checklists',          icone: '📋', sousTitre: 'Par phase et par lot',      bg: '#EEEDFE', color: '#534AB7', badgeTxt: '4 en attente',    badgeBg: '#FAEEDA', badgeColor: '#854F0B', route: 'checklists' },
  { nom: 'Guides et procédures',icone: '📖', sousTitre: 'Normes, DTU, modèles',      bg: '#E6F1FB', color: '#185FA5', badgeTxt: '12 docs',         badgeBg: '#E6F1FB', badgeColor: '#185FA5', route: 'guides' },
  { nom: 'Points Critiques',    icone: '⚠️', sousTitre: 'Problématiques et REX',     bg: '#FCEBEB', color: '#A32D2D', badgeTxt: '2 ouverts',       badgeBg: '#FCEBEB', badgeColor: '#A32D2D', route: 'points' },
  { nom: 'À venir',             icone: '···',sousTitre: 'Module en préparation',     bg: '#F1EFE8', color: '#5F5E5A', badgeTxt: null,              badgeBg: null,       badgeColor: null,      route: null },
]

export default function EcranProjet() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', reference: '', phase: 'EXE' }
  const [phase, setPhase] = useState(projet.phase || 'EXE')

  return (
    <div className="page">
      <Topbar
        breadcrumb={[
          { label: 'Mes projets', path: '/' },
          { label: projet.nom },
        ]}
        phase={phase}
        onPhaseChange={setPhase}
      />
      <div className="content">
        <div className="grid-tuiles">
          {TUILES.map(t => (
            <div
              key={t.nom}
              className="tuile"
              style={{ background: t.bg, borderColor: t.bg }}
              onClick={() => t.route && navigate(`/projet/${id}/${t.route}`, { state: { projet: { ...projet, phase } } })}
            >
              <div className="tuile-icon">{t.icone}</div>
              <div className="tuile-nom" style={{ color: t.color }}>{t.nom}</div>
              <div className="tuile-sub">{t.sousTitre}</div>
              {t.badgeTxt && (
                <span className="badge" style={{ background: t.badgeBg, color: t.badgeColor }}>
                  {t.badgeTxt}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
