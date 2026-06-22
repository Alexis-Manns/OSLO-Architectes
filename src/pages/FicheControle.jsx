import React, { useState, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { supabase } from '../lib/supabase'

export default function FicheControle() {
  const navigate = useNavigate()
  const { id, cid } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }
  const ctrl = location.state?.controle || {}
  const fileRef = useRef()

  const [form, setForm] = useState({
    titre: ctrl.titre || '',
    realise_par: ctrl.realise_par || 'MOE',
    resultat: ctrl.resultat || 'Conforme',
    date: ctrl.date || '',
    type: ctrl.type || 'Total',
    logements: ctrl.logements || '',
    commentaire: ctrl.commentaire || '',
  })
  const [photos, setPhotos] = useState(ctrl.photos || [])
  const [uploading, setUploading] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handlePhotos(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `controles/${id}/${cid}/${Date.now()}.${ext}`
      const { data, error } = await supabase.storage.from('photos').upload(path, file)
      if (!error) {
        const { data: url } = supabase.storage.from('photos').getPublicUrl(path)
        setPhotos(p => [...p, url.publicUrl])
      }
    }
    setUploading(false)
  }

  function removePhoto(url) {
    setPhotos(p => p.filter(u => u !== url))
  }

  return (
    <div className="page">
      <Topbar
        breadcrumb={[
          { label: 'Mes projets', path: '/' },
          { label: projet.nom, path: `/projet/${id}` },
          { label: 'Contrôles Qualité', path: `/projet/${id}/controles` },
          { label: 'Fiche contrôle' },
        ]}
        phase={projet.phase}
      />
      <div className="content">
        <div className="modif-bar">● Modifié le 20/05/2026 par M. Laurent</div>

        <div className="form-group">
          <label className="form-label">Titre</label>
          <input className="form-input" value={form.titre} onChange={e => set('titre', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Réalisé par</label>
          <select className="form-input" value={form.realise_par} onChange={e => set('realise_par', e.target.value)}>
            <option>MOE</option><option>Entreprise</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Résultat</label>
          <select className="form-input" value={form.resultat} onChange={e => set('resultat', e.target.value)}>
            <option>Conforme</option><option>Sous réserves</option><option>Non conforme</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date</label>
          <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Type de contrôle</label>
          <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
            <option>Total</option><option>Échantillonnage</option>
          </select>
        </div>
        {form.type === 'Échantillonnage' && (
          <div className="form-group">
            <label className="form-label">Logements contrôlés</label>
            <input className="form-input" value={form.logements} onChange={e => set('logements', e.target.value)} placeholder="ex: 12, 14, 18" />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Commentaire</label>
          <textarea className="form-input" value={form.commentaire} onChange={e => set('commentaire', e.target.value)} />
        </div>

        {/* Upload photos */}
        <div className="form-group">
          <label className="form-label">Photos du contrôle</label>
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
          <button className="btn-save" onClick={() => navigate(`/projet/${id}/controles`, { state: { projet } })}>Enregistrer</button>
          <button className="btn-cancel" onClick={() => navigate(`/projet/${id}/controles`, { state: { projet } })}>Annuler</button>
        </div>
      </div>
    </div>
  )
}
