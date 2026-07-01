import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { supabase } from '../lib/supabase'

const TUILES = [
  { nom: 'Collaborateurs',       icone: '👥', sousTitre: 'Équipe et intervenants',  bg: '#EEEDFE', color: '#534AB7', badgeTxt: null, route: 'collaborateurs' },
  { nom: 'Contrôles Qualité',    icone: '✅', sousTitre: 'Suivi des vérifications', bg: '#EAF3DE', color: '#3B6D11', badgeTxt: null, route: 'controles' },
  { nom: 'Checklists',           icone: '📋', sousTitre: 'Par phase et par lot',    bg: '#EEEDFE', color: '#534AB7', badgeTxt: null, route: 'checklists' },
  { nom: 'Guides et procédures', icone: '📖', sousTitre: 'Normes, DTU, modèles',    bg: '#E6F1FB', color: '#185FA5', badgeTxt: null, route: 'guides' },
  { nom: 'Points Critiques',     icone: '⚠️', sousTitre: 'Problématiques et REX',   bg: '#FCEBEB', color: '#A32D2D', badgeTxt: null, route: 'points' },
  { nom: 'À venir',              icone: '···',sousTitre: 'Module en préparation',   bg: '#F1EFE8', color: '#5F5E5A', badgeTxt: null, route: null },
]

export default function EcranProjet() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const projetInitial = location.state?.projet || { nom: 'Projet', reference: '', phase: 'EXE' }
  const [phase, setPhase] = useState(projetInitial.phase || 'EXE')
  const [saving, setSaving] = useState(false)
  const [projet, setProjet] = useState(projetInitial)

  // Charger le projet depuis Supabase pour avoir les données à jour
  useEffect(() => {
    async function charger() {
      const { data } = await supabase.from('projets').select('*').eq('id', id).single()
      if (data) {
        setProjet(data)
        setPhase(data.phase)
      }
    }
    charger()
  }, [id])

  async function handlePhaseChange(nouvellePhase) {
    setPhase(nouvellePhase)
    setSaving(true)
    const { error } = await supabase
      .from('projets')
      .update({ phase: nouvellePhase, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) console.error('Erreur mise à jour phase:', error)
    setSaving(false)
  }

  return (
    <div className="page">
      <Topbar
        breadcrumb={[
          { label: 'Mes projets', path: '/' },
          { label: projet.nom },
        ]}
        phase={phase}
        onPhaseChange={handlePhaseChange}
        saving={saving}
      />
      <div className="content">
        {saving && (
          <div style={{ fontSize: 12, color: '#FF8C00', marginBottom: 12, textAlign: 'right' }}>
            ⏳ Sauvegarde en cours…
          </div>
        )}
        <div className="grid-tuiles">
          {TUILES.map(t => (
            <div
              key={t.nom}
              className="tuile"
              style={{
                background: t.bg,
                borderColor: t.bg,
                cursor: t.route ? 'pointer' : 'default',
                opacity: t.route ? 1 : 0.6
              }}
              onClick={() => t.route && navigate(`/projet/${id}/${t.route}`, {
                state: { projet: { ...projet, phase } }
              })}
            >
              <div className="tuile-icon">{t.icone}</div>
              <div className="tuile-nom" style={{ color: t.color }}>{t.nom}</div>
              <div className="tuile-sub">{t.sousTitre}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
