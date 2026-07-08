import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { supabase } from '../lib/supabase'

const BADGE_RESULTAT = {
  'Conforme':      { bg: '#EAF3DE', color: '#3B6D11' },
  'Sous réserves': { bg: '#FAEEDA', color: '#854F0B' },
  'Non conforme':  { bg: '#FCEBEB', color: '#A32D2D' },
}
const BADGE_REAL = {
  'MOE':        { bg: '#EEEDFE', color: '#534AB7' },
  'Entreprise': { bg: '#FAECE7', color: '#993C1D' },
}

function dateFR(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR')
}

function estRecent(createdAt, updatedAt) {
  if (!updatedAt) return false
  // Pas de MAJ si created_at et updated_at sont quasi identiques (vient d'être créé)
  if (createdAt && Math.abs(new Date(updatedAt) - new Date(createdAt)) < 10000) return false
  const diff = Date.now() - new Date(updatedAt).getTime()
  return diff < 7 * 24 * 60 * 60 * 1000
}

export default function Controles() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }
  const [controles, setControles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { charger() }, [id])

  async function charger() {
    setLoading(true)
    const { data } = await supabase
      .from('controles')
      .select('*')
      .eq('projet_id', id)
      .order('created_at', { ascending: false })
    setControles(data || [])
    setLoading(false)
  }

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
        {loading ? (
          <div className="loading">Chargement…</div>
        ) : controles.length === 0 ? (
          <div style={{ color: 'var(--texte-sec)', fontSize: 13, padding: '30px 0', textAlign: 'center' }}>
            Aucun contrôle pour ce projet
          </div>
        ) : (
          controles.map(c => {
            const br = BADGE_RESULTAT[c.resultat] || {}
            const bl = BADGE_REAL[c.realise_par] || {}
            const maj = estRecent(c.created_at, c.updated_at)
            return (
              <div
                key={c.id}
                className="list-item"
                style={{ alignItems: 'flex-start', padding: '12px', cursor: 'pointer' }}
                onClick={() => navigate(`/projet/${id}/controles/${c.id}`, { state: { projet, controle: c } })}
              >
                <div className="item-info">
                  <div className="item-nom">{c.designation || c.titre}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {c.resultat && <span className="badge" style={{ background: br.bg, color: br.color }}>{c.resultat}</span>}
                    {c.realise_par && <span className="badge" style={{ background: bl.bg, color: bl.color }}>{c.realise_par}</span>}
                    {c.type_controle && <span className="badge badge-gris">{c.type_controle}</span>}
                  </div>
                  <div className="item-sub" style={{ marginTop: 4 }}>
                    {c.date_controle ? dateFR(c.date_controle) : '—'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {maj && (
                    <span className="badge badge-orange" style={{ fontSize: 10 }}>
                      MAJ {dateFR(c.updated_at)}
                    </span>
                  )}
                  <span className="arrow">›</span>
                </div>
              </div>
            )
          })
        )}
        <button
          className="btn-add"
          onClick={() => navigate(`/projet/${id}/controles/nouveau`, { state: { projet } })}
        >
          + Nouveau contrôle
        </button>
      </div>
    </div>
  )
}
