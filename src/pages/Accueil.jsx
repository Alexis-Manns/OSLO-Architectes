import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const PHASES_BADGES = {
  APS: { bg: '#FAECE7', color: '#993C1D' },
  APD: { bg: '#FAEEDA', color: '#854F0B' },
  PC:  { bg: '#E6F1FB', color: '#185FA5' },
  PRO: { bg: '#E6F1FB', color: '#185FA5' },
  DCE: { bg: '#FAEEDA', color: '#854F0B' },
  ACT: { bg: '#EEEDFE', color: '#534AB7' },
  EXE: { bg: '#EAF3DE', color: '#3B6D11' },
  OPR: { bg: '#FCEBEB', color: '#A32D2D' },
  AOR: { bg: '#F1EFE8', color: '#5F5E5A' },
}
const EMOJIS = ['🏢','🏗️','🏫','🏡','🏟️','📚','🏛️','🏬','🏭']

export default function Accueil() {
  const navigate = useNavigate()
  const { user, profil, peutCreerProjet, peutArchiverProjet, peutSupprimerProjet, deconnexion } = useAuth()

  const [onglet, setOnglet]           = useState('mes')  // 'mes' | 'tous' | 'archives'
  const [projets, setProjets]         = useState([])
  const [mesProjets, setMesProjets]   = useState([])     // IDs des projets "mes projets"
  const [recherche, setRecherche]     = useState('')
  const [loading, setLoading]         = useState(true)
  const [menuOuvert, setMenuOuvert]   = useState(null)   // id du projet avec menu ouvert
  const [confirmSuppr, setConfirmSuppr] = useState(null)
  const [modalNouveau, setModalNouveau] = useState(false)
  const [uploadingId, setUploadingId] = useState(null)
  const [hoveredId, setHoveredId]     = useState(null)
  const fileRefs = useRef({})
  const menuRef  = useRef({})

  // Nouveau projet form
  const [formNouv, setFormNouv] = useState({ nom: '', reference: '', phase: 'EXE' })
  const [savingNouv, setSavingNouv] = useState(false)

  useEffect(() => { charger() }, [user])

  // Fermer menu si clic extérieur
  useEffect(() => {
    function handleClick(e) {
      if (menuOuvert && !e.target.closest('.menu-dots')) setMenuOuvert(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOuvert])

  async function charger() {
    setLoading(true)
    const { data } = await supabase
      .from('projets')
      .select('*')
      .order('reference', { ascending: true })
    setProjets(data || [])

    if (user) {
      const { data: mp } = await supabase
        .from('mes_projets')
        .select('projet_id')
        .eq('user_id', user.id)
      setMesProjets(mp?.map(r => r.projet_id) || [])
    }
    setLoading(false)
  }

  async function ajouterAMesProjets(projetId) {
    await supabase.from('mes_projets').insert({ user_id: user.id, projet_id: projetId })
    setMesProjets(prev => [...prev, projetId])
    setMenuOuvert(null)
  }

  async function retirerDeMesProjets(projetId) {
    await supabase.from('mes_projets').delete().eq('user_id', user.id).eq('projet_id', projetId)
    setMesProjets(prev => prev.filter(id => id !== projetId))
    setMenuOuvert(null)
  }

  async function archiverProjet(projetId) {
    await supabase.from('projets').update({ archive: true }).eq('id', projetId)
    // Retirer de mes_projets pour tous
    await supabase.from('mes_projets').delete().eq('projet_id', projetId)
    setMenuOuvert(null)
    charger()
  }

  async function supprimerProjet(projet) {
    await supabase.from('projets').delete().eq('id', projet.id)
    setConfirmSuppr(null)
    charger()
  }

  async function creerProjet() {
    if (!formNouv.nom.trim()) return
    setSavingNouv(true)
    const { data } = await supabase.from('projets').insert({
      nom: formNouv.nom,
      reference: formNouv.reference,
      phase: formNouv.phase,
      archive: false,
      created_at: new Date().toISOString(),
    }).select().single()

    if (data && user) {
      await supabase.from('mes_projets').insert({ user_id: user.id, projet_id: data.id })
    }
    setSavingNouv(false)
    setModalNouveau(false)
    setFormNouv({ nom: '', reference: '', phase: 'EXE' })
    charger()
  }

  async function handleImageUpload(e, projet) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setUploadingId(projet.id)
    const ext = file.name.split('.').pop()
    const path = `projets/${projet.id}/cover.${ext}`
    const { data: existingFiles } = await supabase.storage.from('Photos').list(`projets/${projet.id}`)
    if (existingFiles?.length > 0) {
      await supabase.storage.from('Photos').remove(existingFiles.map(f => `projets/${projet.id}/${f.name}`))
    }
    await supabase.storage.from('Photos').upload(path, file)
    const { data: urlData } = supabase.storage.from('Photos').getPublicUrl(path)
    const image_url = `${urlData.publicUrl}?t=${Date.now()}`
    await supabase.from('projets').update({ image_url }).eq('id', projet.id)
    setProjets(prev => prev.map(p => p.id === projet.id ? { ...p, image_url } : p))
    setUploadingId(null)
  }

  // Filtrage
  const projetsFiltres = projets.filter(p => {
    const q = recherche.toLowerCase()
    const matchRecherche = !q || p.nom?.toLowerCase().includes(q) || p.reference?.toLowerCase().includes(q)
    if (onglet === 'mes')      return !p.archive && mesProjets.includes(p.id) && matchRecherche
    if (onglet === 'tous')     return !p.archive && matchRecherche
    if (onglet === 'archives') return p.archive && matchRecherche
    return false
  })

  const PHASES = ['APS','APD','PC','PRO','DCE','ACT','EXE','OPR','AOR']

  return (
    <div className="page">
      <Topbar
        breadcrumb={[{ label: 'Oslo Architectes' }]}
        profil={profil}
        onDeconnexion={deconnexion}
      />
      <div className="content">

        {/* Onglets */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div className="tabs" style={{ marginBottom: 0, border: 'none' }}>
            {[
              { key: 'mes',      label: 'Mes projets' },
              { key: 'tous',     label: 'Tous les projets' },
              { key: 'archives', label: 'Archivés' },
            ].map(t => (
              <button key={t.key} className={`tab-btn ${onglet === t.key ? 'active' : ''}`}
                onClick={() => setOnglet(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Recherche */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--texte-sec)', fontSize: 14 }}>🔍</span>
              <input
                className="form-input"
                style={{ paddingLeft: 32, width: 220, margin: 0 }}
                placeholder="Rechercher un projet…"
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
              />
            </div>
            {/* Bouton nouveau projet */}
            {peutCreerProjet && onglet !== 'archives' && (
              <button className="btn-save" onClick={() => setModalNouveau(true)}
                style={{ whiteSpace: 'nowrap' }}>
                + Nouveau projet
              </button>
            )}
          </div>
        </div>

        {loading ? <div className="loading">Chargement…</div>
          : projetsFiltres.length === 0 ? (
            <div style={{ color: 'var(--texte-sec)', fontSize: 13, padding: '40px 0', textAlign: 'center' }}>
              {onglet === 'mes' ? 'Aucun projet dans vos projets — ajoutez-en depuis "Tous les projets"'
                : onglet === 'archives' ? 'Aucun projet archivé'
                : 'Aucun projet trouvé'}
            </div>
          ) : (
            <div className="grid-projets">
              {projetsFiltres.map((p, i) => {
                const badge = PHASES_BADGES[p.phase] || PHASES_BADGES.EXE
                const dansMesProjets = mesProjets.includes(p.id)
                return (
                  <div key={p.id} className="card" style={{ position: 'relative' }}>
                    {/* Image */}
                    <div className="projet-img" style={{ position: 'relative', cursor: 'pointer' }}
                      onClick={e => { e.stopPropagation(); fileRefs.current[p.id]?.click() }}
                      onMouseEnter={() => setHoveredId(p.id)}
                      onMouseLeave={() => setHoveredId(null)}>
                      {uploadingId === p.id ? (
                        <div style={{ fontSize: 13, color: '#888' }}>⏳</div>
                      ) : p.image_url ? (
                        <>
                          <img src={p.image_url} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {hoveredId === p.id && (
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 13, fontWeight: 500 }}>
                              ✏️ Changer
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: 32 }}>{EMOJIS[i % EMOJIS.length]}</span>
                          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 10 }}>+ Photo</span>
                        </div>
                      )}
                      <input ref={el => fileRefs.current[p.id] = el} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageUpload(e, p)} />
                    </div>

                    {/* Corps */}
                    <div className="projet-body" style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/projet/${p.id}`, { state: { projet: p } })}>
                      <div className="projet-ref">{p.reference}</div>
                      <div className="projet-nom">{p.nom}</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                        <span className="badge" style={{ background: badge.bg, color: badge.color }}>{p.phase}</span>

                        {/* Menu ··· */}
                        {onglet !== 'archives' && (
                          <div className="menu-dots" style={{ position: 'relative' }}>
                            <button
                              onClick={e => { e.stopPropagation(); setMenuOuvert(menuOuvert === p.id ? null : p.id) }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--texte-sec)', padding: '2px 6px', borderRadius: 4 }}
                            >···</button>
                            {menuOuvert === p.id && (
                              <div style={{
                                position: 'absolute', right: 0, bottom: '100%', marginBottom: 4,
                                background: 'var(--blanc)', border: '1px solid var(--bordure)',
                                borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                                minWidth: 190, zIndex: 50, overflow: 'hidden',
                              }} onClick={e => e.stopPropagation()}>
                                {/* Mes projets toggle */}
                                <button onClick={() => dansMesProjets ? retirerDeMesProjets(p.id) : ajouterAMesProjets(p.id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', color: 'var(--texte)', textAlign: 'left' }}>
                                  {dansMesProjets ? '➖ Retirer de mes projets' : '➕ Ajouter à mes projets'}
                                </button>
                                {peutArchiverProjet && (
                                  <button onClick={() => { archiverProjet(p.id); setMenuOuvert(null) }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', color: 'var(--texte)', textAlign: 'left', borderTop: '1px solid var(--bordure)' }}>
                                    📦 Archiver le projet
                                  </button>
                                )}
                                {peutSupprimerProjet && (
                                  <button onClick={() => { setConfirmSuppr(p); setMenuOuvert(null) }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', color: '#E24B4A', textAlign: 'left', borderTop: '1px solid var(--bordure)' }}>
                                    🗑️ Supprimer le projet
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>

      {/* Modal nouveau projet */}
      {modalNouveau && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--blanc)', borderRadius: 12, padding: 24, maxWidth: 400, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 16 }}>Nouveau projet</div>
            <div className="form-group">
              <label className="form-label">Nom du projet *</label>
              <input className="form-input" value={formNouv.nom} onChange={e => setFormNouv(f => ({ ...f, nom: e.target.value }))} placeholder="Ex: Résidence Les Acacias" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Numéro d'affaire</label>
              <input className="form-input" value={formNouv.reference} onChange={e => setFormNouv(f => ({ ...f, reference: e.target.value }))} placeholder="Ex: 2024-047" />
            </div>
            <div className="form-group">
              <label className="form-label">Phase initiale</label>
              <select className="form-input" value={formNouv.phase} onChange={e => setFormNouv(f => ({ ...f, phase: e.target.value }))}>
                {['APS','APD','PC','PRO','DCE','ACT','EXE','OPR','AOR'].map(ph => <option key={ph}>{ph}</option>)}
              </select>
            </div>
            <div className="btn-row">
              <button className="btn-save" onClick={creerProjet} disabled={savingNouv || !formNouv.nom.trim()}>
                {savingNouv ? 'Création…' : 'Créer le projet'}
              </button>
              <button className="btn-cancel" onClick={() => setModalNouveau(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {confirmSuppr && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--blanc)', borderRadius: 12, padding: 24, maxWidth: 380, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Supprimer ce projet</div>
            <div style={{ color: 'var(--texte-sec)', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
              Voulez-vous supprimer <strong>"{confirmSuppr.nom}"</strong> ?
              <span style={{ display: 'block', marginTop: 6, color: '#E24B4A', fontWeight: 500 }}>
                Toutes les données seront définitivement perdues.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ background: '#E24B4A', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                onClick={() => supprimerProjet(confirmSuppr)}>Supprimer</button>
              <button className="btn-cancel" onClick={() => setConfirmSuppr(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
