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
  if (!updatedAt || !createdAt) return false
  const created = new Date(createdAt).getTime()
  const updated = new Date(updatedAt).getTime()
  // Pas de MAJ si modifié moins de 30 secondes après la création
  if (Math.abs(updated - created) < 30000) return false
  // Pas de MAJ si la modification date de plus de 7 jours
  const diff = Date.now() - updated
  return diff < 7 * 24 * 60 * 60 * 1000
}

export default function Controles() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }
  const [controles, setControles] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmSuppr, setConfirmSuppr] = useState(null)

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

  async function supprimer(controle) {
    await supabase.from('controles').delete().eq('id', controle.id)
    setConfirmSuppr(null)
    charger()
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
              <div key={c.id} className="list-item" style={{ alignItems: 'flex-start', padding: '12px', gap: 8 }}>
                <div
                  style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                  onClick={() => navigate(`/projet/${id}/controles/${c.id}`, { state: { projet, controle: c } })}
                >
                  <div className="item-nom">{c.designation || c.titre}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {c.resultat && <span className="badge" style={{ background: br.bg, color: br.color }}>{c.resultat}</span>}
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
                  <span className="arrow" style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/projet/${id}/controles/${c.id}`, { state: { projet, controle: c } })}>›</span>
                  <button
                    onClick={() => setConfirmSuppr(c)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', fontSize: 18, padding: '4px 6px', borderRadius: 6, flexShrink: 0 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#E24B4A'}
                    onMouseLeave={e => e.currentTarget.style.color = '#ddd'}
                    title="Supprimer ce contrôle"
                  >✕</button>
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

      {confirmSuppr && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--blanc)', borderRadius: 12, padding: 24, maxWidth: 360, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Supprimer ce contrôle</div>
            <div style={{ color: 'var(--texte-sec)', fontSize: 13, marginBottom: 20 }}>
              Voulez-vous supprimer <strong>{confirmSuppr.designation || confirmSuppr.titre}</strong> ? Cette action est irréversible.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{ background: '#E24B4A', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                onClick={() => supprimer(confirmSuppr)}
              >Supprimer</button>
              <button className="btn-cancel" onClick={() => setConfirmSuppr(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
