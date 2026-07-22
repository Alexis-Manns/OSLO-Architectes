import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { supabase } from '../lib/supabase'
import { useRealtime } from '../useRealtime'

const STATUT_DOT = { 'Ouvert': '#E24B4A', 'En suivi': '#EF9F27', 'Résolu': '#639922' }
const STATUT_BADGE = {
  'Ouvert':   { bg: '#FCEBEB', color: '#A32D2D' },
  'En suivi': { bg: '#FAEEDA', color: '#854F0B' },
  'Résolu':   { bg: '#EAF3DE', color: '#3B6D11' },
}
const PRIORITE_BADGE = {
  'Urgente':  { bg: '#FCEBEB', color: '#A32D2D' },
  'A suivre': { bg: '#FAEEDA', color: '#854F0B' },
}

function dateFR(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR')
}

function estRecent(createdAt, updatedAt) {
  if (!updatedAt || !createdAt) return false
  if (Math.abs(new Date(updatedAt) - new Date(createdAt)) < 30000) return false
  return Date.now() - new Date(updatedAt).getTime() < 7 * 24 * 60 * 60 * 1000
}

export default function Points() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }
  const [points, setPoints] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmSuppr, setConfirmSuppr] = useState(null)

  useRealtime('points_critiques', charger)
  useEffect(() => { charger() }, [id])

  async function charger() {
    setLoading(true)
    const { data } = await supabase
      .from('points_critiques')
      .select('*')
      .eq('projet_id', id)
      .order('created_at', { ascending: false })
    setPoints(data || [])
    setLoading(false)
  }

  async function supprimer(point) {
    await supabase.from('points_critiques').delete().eq('id', point.id)
    setConfirmSuppr(null)
    charger()
  }

  return (
    <div className="page">
      <Topbar
        breadcrumb={[
          { label: 'Mes projets', path: '/' },
          { label: projet.nom, path: `/projet/${id}` },
          { label: 'Points Critiques' },
        ]}
        phase={projet.phase}
      />
      <div className="content">
        {loading ? <div className="loading">Chargement…</div>
          : points.length === 0 ? (
            <div style={{ color: 'var(--texte-sec)', fontSize: 13, padding: '30px 0', textAlign: 'center' }}>
              Aucun point critique pour ce projet
            </div>
          ) : points.map(p => {
            const bs = STATUT_BADGE[p.statut] || {}
            const bp = PRIORITE_BADGE[p.priorite] || {}
            const maj = estRecent(p.created_at, p.updated_at)
            return (
              <div key={p.id} className="list-item" style={{ alignItems: 'flex-start', padding: '12px', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}
                  onClick={() => navigate(`/projet/${id}/points/${p.id}`, { state: { projet, point: p } })}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUT_DOT[p.statut] || '#ccc', flexShrink: 0, marginTop: 4 }} />
                  <div className="item-info">
                    <div className="item-nom">{p.designation || p.titre}</div>
                    <div className="item-sub">Signalé le {dateFR(p.date_signalement)} · {p.signale_par}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {p.statut && <span className="badge" style={{ background: bs.bg, color: bs.color }}>{p.statut}</span>}
                      {p.statut !== 'Résolu' && p.priorite && <span className="badge" style={{ background: bp.bg, color: bp.color }}>{p.priorite}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {maj && <span className="badge badge-orange" style={{ fontSize: 10 }}>MAJ {dateFR(p.updated_at)}</span>}
                  <span className="arrow" style={{ cursor: 'pointer' }} onClick={() => navigate(`/projet/${id}/points/${p.id}`, { state: { projet, point: p } })}>›</span>
                  <button
                    onClick={() => setConfirmSuppr(p)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', fontSize: 18, padding: '4px 6px', borderRadius: 6 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#E24B4A'}
                    onMouseLeave={e => e.currentTarget.style.color = '#ddd'}
                  >✕</button>
                </div>
              </div>
            )
          })
        }
        <button className="btn-add"
          onClick={() => navigate(`/projet/${id}/points/nouveau`, { state: { projet } })}>
          + Nouveau point critique
        </button>
      </div>

      {confirmSuppr && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--blanc)', borderRadius: 12, padding: 24, maxWidth: 380, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Supprimer ce point critique</div>
            <div style={{ color: 'var(--texte-sec)', fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
              Voulez-vous supprimer <strong>"{confirmSuppr.designation || confirmSuppr.titre}"</strong> ?
              <span style={{ display: 'block', marginTop: 6, color: '#E24B4A' }}>Cette action est irréversible.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ background: '#E24B4A', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                onClick={() => supprimer(confirmSuppr)}>Supprimer</button>
              <button className="btn-cancel" onClick={() => setConfirmSuppr(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
