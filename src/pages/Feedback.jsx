import React, { useState, useEffect } from 'react'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const TYPES = ['Bug', 'Amélioration', 'Question', 'Autre']
const TYPE_COLORS = {
  'Bug':          { bg: '#FCEBEB', color: '#A32D2D' },
  'Amélioration': { bg: '#EAF3DE', color: '#3B6D11' },
  'Question':     { bg: '#E6F1FB', color: '#185FA5' },
  'Autre':        { bg: '#F1EFE8', color: '#5F5E5A' },
}
const STATUT_COLORS = {
  'Nouveau':  { bg: '#FAEEDA', color: '#854F0B' },
  'En cours': { bg: '#E6F1FB', color: '#185FA5' },
  'Résolu':   { bg: '#EAF3DE', color: '#3B6D11' },
}

function dateFR(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR')
}

export default function Feedback() {
  const { profil, deconnexion } = useAuth()
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtreType, setFiltreType] = useState('Tous')
  const [filtreStatut, setFiltreStatut] = useState('Tous')

  useEffect(() => { charger() }, [])

  async function charger() {
    setLoading(true)

    // Charger les feedbacks
    const { data: fbs, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) { console.error(error); setLoading(false); return }
    if (!fbs || fbs.length === 0) { setFeedbacks([]); setLoading(false); return }

    // Charger les profils associés
    const userIds = [...new Set(fbs.filter(f => f.user_id).map(f => f.user_id))]
    let profilsMap = {}
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from('profils')
        .select('id, prenom, nom, email')
        .in('id', userIds)
      profs?.forEach(p => { profilsMap[p.id] = p })
    }

    setFeedbacks(fbs.map(f => ({ ...f, auteur: profilsMap[f.user_id] || null })))
    setLoading(false)
  }

  async function changerStatut(id, statut) {
    await supabase.from('feedbacks').update({ statut }).eq('id', id)
    charger()
  }

  async function supprimer(id) {
    await supabase.from('feedbacks').delete().eq('id', id)
    charger()
  }

  const feedbacksFiltres = feedbacks.filter(f => {
    const okType   = filtreType   === 'Tous' || f.type   === filtreType
    const okStatut = filtreStatut === 'Tous' || f.statut === filtreStatut
    return okType && okStatut
  })

  const nouveaux = feedbacks.filter(f => f.statut === 'Nouveau').length

  return (
    <div className="page">
      <Topbar
        breadcrumb={[
          { label: 'Oslo Architectes', path: '/' },
          { label: 'Retours utilisateurs' },
        ]}
        profil={profil}
        onDeconnexion={deconnexion}
      />
      <div className="content">
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          {nouveaux > 0 && (
            <span className="badge" style={{ background: '#FAEEDA', color: '#854F0B', fontSize: 12 }}>
              {nouveaux} nouveau{nouveaux > 1 ? 'x' : ''}
            </span>
          )}
          <select className="form-input" style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
            value={filtreType} onChange={e => setFiltreType(e.target.value)}>
            <option>Tous</option>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="form-input" style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
            value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}>
            <option>Tous</option>
            <option>Nouveau</option>
            <option>En cours</option>
            <option>Résolu</option>
          </select>
        </div>

        {loading ? <div className="loading">Chargement...</div>
          : feedbacksFiltres.length === 0 ? (
            <div style={{ color: 'var(--texte-sec)', fontSize: 13, padding: '30px 0', textAlign: 'center' }}>
              Aucun retour pour l'instant
            </div>
          ) : feedbacksFiltres.map(f => {
            const tc = TYPE_COLORS[f.type]   || {}
            const sc = STATUT_COLORS[f.statut] || {}
            return (
              <div key={f.id} style={{
                background: 'var(--blanc)', border: '1px solid var(--bordure)',
                borderRadius: 10, padding: 14, marginBottom: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <Avatar nom={f.auteur?.nom || '?'} prenom={f.auteur?.prenom || ''} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>
                        {f.auteur ? `${f.auteur.prenom || ''} ${f.auteur.nom || ''}`.trim() : 'Utilisateur inconnu'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--texte-sec)' }}>{dateFR(f.created_at)}</span>
                      <span className="badge" style={{ background: tc.bg, color: tc.color, fontSize: 11 }}>{f.type}</span>
                      <span className="badge" style={{ background: sc.bg, color: sc.color, fontSize: 11 }}>{f.statut}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, marginTop: 6 }}>{f.titre}</div>
                    {f.description && (
                      <div style={{ fontSize: 12, color: 'var(--texte-sec)', marginTop: 4, lineHeight: 1.6 }}>
                        {f.description}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Nouveau', 'En cours', 'Résolu'].map(s => (
                    <button key={s} onClick={() => changerStatut(f.id, s)} style={{
                      padding: '4px 12px', borderRadius: 6, fontSize: 12,
                      cursor: 'pointer', fontFamily: 'inherit',
                      border: '1px solid var(--bordure)',
                      background: f.statut === s ? STATUT_COLORS[s]?.bg : 'none',
                      color: f.statut === s ? STATUT_COLORS[s]?.color : 'var(--texte-sec)',
                      fontWeight: f.statut === s ? 600 : 400,
                    }}>{s}</button>
                  ))}
                  <button onClick={() => supprimer(f.id)} style={{
                    marginLeft: 'auto', padding: '4px 12px', borderRadius: 6, fontSize: 12,
                    cursor: 'pointer', fontFamily: 'inherit',
                    border: '1px solid var(--bordure)', background: 'none', color: '#E24B4A',
                  }}>Supprimer</button>
                </div>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}
