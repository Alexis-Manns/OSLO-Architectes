import React, { useState, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { supabase } from '../lib/supabase'

export default function FichePoint() {
  const navigate = useNavigate()
  const { id, pid } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }
  const point = location.state?.point || {}
  const fileRef = useRef()

  const [form, setForm] = useState({
    titre: point.titre || '',
    statut: point.statut || 'Ouvert',
    priorite: point.priorite || 'Haute',
    phase: point.phase || projet.phase || 'EXE',
    signale_par: point.auteur || '',
    date_signalement: '',
    description: point.description || '',
    rex: point.rex || '',
  })
  const [photos, setPhotos] = useState(point.photos || [])
  const [uploading, setUploading] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handlePhotos(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `points/${id}/${pid}/${Date.now()}.${ext}`
      const { data, error } = await supabase.storage.from('Photos').upload(path, file)
      if (!error) {
        const { data: url } = supabase.storage.from('Photos').getPublicUrl(path)
        setPhotos(p => [...p, url.publicUrl])
      }
    }
    setUploading(false)
  }

  function removePhoto(url) { setPhotos(p => p.filter(u => u !== url)) }

  const PHASES = ['APS','APD','PC','PRO','DCE','ACT','EXE','OPR','AOR']

  return (
    <div className="page">
      <Topbar
        breadcrumb={[
          { label: 'Mes projets', path: '/' },
          { label: projet.nom, path: `/projet/${id}` },
          { label: 'Points Critiques', path: `/projet/${id}/points` },
          { label: form.titre || 'Nouveau point' },
        ]}
        phase={projet.phase}
      />
      <div className="content">
        <div className="modif-bar">● Modifié le {point.date || '—'} par {point.auteur || '—'}</div>

        <div className="form-group">
          <label className="form-label">Titre</label>
          <input className="form-input" value={form.titre} onChange={e => set('titre', e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Statut</label>
            <select className="form-input" value={form.statut} onChange={e => set('statut', e.target.value)}>
              <option>Ouvert</option><option>En suivi</option><option>Résolu</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Priorité</label>
            <select className="form-input" value={form.priorite} onChange={e => set('priorite', e.target.value)}>
              <option>Haute</option><option>Moyenne</option><option>Faible</option>
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
            <label className="form-label">Date signalement</label>
            <input className="form-input" type="date" value={form.date_signalement} onChange={e => set('date_signalement', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Signalé par</label>
          <input className="form-input" value={form.signale_par} onChange={e => set('signale_par', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Leçon apprise / REX</label>
          <textarea className="form-input" value={form.rex} onChange={e => set('rex', e.target.value)} />
        </div>

        {/* Upload photos */}
        <div className="form-group">
          <label className="form-label">Photos</label>
          <div className="photo-upload" onClick={() => fileRef.current.click()}>
            {uploading ? '⏳ Upload en cours…' : '📷 Cliquer pour ajouter des photos'}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handlePhotos} />
          {photos.length > 0 && (
            <div className="photos-grid">
              {photos.map((url, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={url} alt="" className="photo-thumb" />
                  <button onClick={() => removePhoto(url)} style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'rgba(0,0,0,0.55)', color: 'white',
                    border: 'none', borderRadius: '50%', width: 20, height: 20,
                    cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="btn-row">
          <button className="btn-save" onClick={() => navigate(`/projet/${id}/points`, { state: { projet } })}>Enregistrer</button>
          <button className="btn-cancel" onClick={() => navigate(`/projet/${id}/points`, { state: { projet } })}>Annuler</button>
        </div>
      </div>
    </div>
  )
}
