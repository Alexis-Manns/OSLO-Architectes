import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { supabase } from '../lib/supabase'

const PHASES = ['APS','APD','PC','PRO','DCE','ACT','EXE','OPR','AOR']

const STATUT_BADGE = {
  'Ouvert':   { bg: '#FCEBEB', color: '#A32D2D' },
  'En suivi': { bg: '#FAEEDA', color: '#854F0B' },
  'Résolu':   { bg: '#EAF3DE', color: '#3B6D11' },
}

function dateFR(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR')
}

export default function FichePoint() {
  const navigate = useNavigate()
  const { id, pid } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE', reference: '' }
  const isNouveau = !pid || pid === 'nouveau' || pid === 'undefined'
  const fileRef = useRef()
  const tempId = useRef(`tmp_${Date.now()}`)

  const [form, setForm] = useState({
    designation: '',
    statut: 'Ouvert',
    priorite: 'Urgente',
    phase: projet.phase || 'EXE',
    signale_par: '',
    date_signalement: new Date().toISOString().split('T')[0],
    description: '',
    rex: '',
  })
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [photoAgrandie, setPhotoAgrandie] = useState(null)
  // MAJ : on stocke qui a modifié et quand
  const [majInfo, setMajInfo] = useState(null) // { date, par }

  useEffect(() => {
    if (!isNouveau && pid) charger()
  }, [pid])

  async function charger() {
    const { data } = await supabase.from('points_critiques').select('*').eq('id', pid).single()
    if (data) {
      setForm({
        designation:      data.designation      || data.titre || '',
        statut:           data.statut           || 'Ouvert',
        priorite:         data.priorite         || 'Urgente',
        phase:            data.phase            || 'EXE',
        signale_par:      data.signale_par      || '',
        date_signalement: data.date_signalement || '',
        description:      data.description      || '',
        rex:              data.lecon_rex        || '',
      })
      setPhotos(data.photos || [])
      // Afficher MAJ seulement si updated_at et created_at diffèrent de plus de 30s
      if (data.updated_at && data.created_at) {
        const diff = Math.abs(new Date(data.updated_at) - new Date(data.created_at))
        if (diff > 30000) {
          setMajInfo({ date: data.updated_at, par: data.modifie_par || '—' })
        }
      }
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function enregistrer() {
    setSaving(true)
    setErreur(null)
    const now = new Date().toISOString()
    // Pour l'instant on met un placeholder — sera remplacé par le vrai utilisateur connecté
    const utilisateur = 'Utilisateur'

    const payload = {
      designation:      form.designation,
      statut:           form.statut,
      priorite:         form.priorite,
      phase:            form.phase,
      signale_par:      form.signale_par,
      date_signalement: form.date_signalement || null,
      description:      form.description,
      lecon_rex:        form.rex,
      photos:           photos,
      updated_at:       now,
      modifie_par:      utilisateur,
    }

    if (isNouveau) {
      const { error } = await supabase.from('points_critiques').insert({
        ...payload,
        projet_id:  id,
        created_at: now,
      })
      if (error) { setErreur('Erreur : ' + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('points_critiques').update(payload).eq('id', pid)
      if (error) { setErreur('Erreur : ' + error.message); setSaving(false); return }
    }

    setSaving(false)
    navigate(`/projet/${id}/points`, { state: { projet } })
  }

  async function handlePhotos(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    e.target.value = ''
    setUploading(true)
    const dossier = isNouveau ? tempId.current : pid
    const urls = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `points/${id}/${dossier}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('Photos').upload(path, file)
      if (!error) {
        const { data } = supabase.storage.from('Photos').getPublicUrl(path)
        urls.push(data.publicUrl)
      }
    }
    setPhotos(p => [...p, ...urls])
    setUploading(false)
  }

  const bc = STATUT_BADGE[form.statut] || {}

  return (
    <div className="page">
      <Topbar
        breadcrumb={[
          { label: 'Mes projets', path: '/' },
          { label: projet.nom, path: `/projet/${id}` },
          { label: 'Points Critiques', path: `/projet/${id}/points` },
          { label: isNouveau ? 'Nouveau point' : (form.designation || 'Fiche') },
        ]}
        phase={projet.phase}
      />
      <div className="content">

        {/* Bandeau MAJ — uniquement si modification réelle */}
        {majInfo && (
          <div className="modif-bar">
            ● Modifié le {dateFR(majInfo.date)} par {majInfo.par}
          </div>
        )}

        {/* Badge statut */}
        {form.statut && (
          <div style={{ marginBottom: 14 }}>
            <span className="badge" style={{ background: bc.bg, color: bc.color }}>{form.statut}</span>
          </div>
        )}

        {erreur && (
          <div style={{ background: '#FCEBEB', border: '1px solid #F09595', color: '#A32D2D', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
            {erreur}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Désignation *</label>
          <input className="form-input" value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="Ex: Infiltration eau toiture — Bât. B" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Statut</label>
            <select className="form-input" value={form.statut} onChange={e => set('statut', e.target.value)}>
              <option>Ouvert</option>
              <option>En suivi</option>
              <option>Résolu</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priorité</label>
            <select className="form-input" value={form.priorite} onChange={e => set('priorite', e.target.value)}>
              <option>Urgente</option>
              <option>A suivre</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Phase</label>
            <select className="form-input" value={form.phase} onChange={e => set('phase', e.target.value)}>
              {PHASES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date de signalement</label>
            <input className="form-input" type="date" value={form.date_signalement} onChange={e => set('date_signalement', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Signalé par</label>
          <input className="form-input" value={form.signale_par} onChange={e => set('signale_par', e.target.value)} placeholder="Nom du signalant" />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Décrire le problème constaté…" />
        </div>

        {/* REX uniquement si Résolu */}
        {form.statut === 'Résolu' && (
          <div className="form-group">
            <label className="form-label" style={{ color: '#3B6D11', fontWeight: 600 }}>Leçon apprise / REX</label>
            <textarea
              className="form-input"
              value={form.rex}
              onChange={e => set('rex', e.target.value)}
              rows={3}
              placeholder="Qu'avons-nous appris ? Comment éviter ce problème à l'avenir ?"
              style={{ borderColor: 'rgba(59,109,17,0.3)' }}
            />
          </div>
        )}

        {/* Photos */}
        <div className="form-group">
          <label className="form-label">Photos</label>
          <div className="photo-upload" onClick={() => fileRef.current.click()}>
            {uploading ? '⏳ Upload en cours…' : '📷 Cliquer pour ajouter des photos'}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotos} />
          {photos.length > 0 && (
            <div className="photos-grid" style={{ marginTop: 10 }}>
              {photos.map((url, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={url} alt="" className="photo-thumb" style={{ cursor: 'zoom-in' }} onClick={() => setPhotoAgrandie(url)} />
                  <button onClick={() => setPhotos(p => p.filter(u => u !== url))} style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'rgba(0,0,0,0.55)', color: 'white',
                    border: 'none', borderRadius: '50%', width: 22, height: 22,
                    cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="btn-row">
          <button className="btn-save" onClick={enregistrer} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button className="btn-cancel" onClick={() => navigate(`/projet/${id}/points`, { state: { projet } })}>
            Annuler
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {photoAgrandie && (
        <div onClick={() => setPhotoAgrandie(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20, cursor: 'zoom-out'
        }}>
          <img src={photoAgrandie} alt="" style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 8, objectFit: 'contain' }} />
          <button onClick={() => setPhotoAgrandie(null)} style={{
            position: 'fixed', top: 16, right: 16,
            background: 'rgba(255,255,255,0.15)', border: 'none',
            color: 'white', width: 36, height: 36, borderRadius: '50%',
            fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>×</button>
        </div>
      )}
    </div>
  )
}
