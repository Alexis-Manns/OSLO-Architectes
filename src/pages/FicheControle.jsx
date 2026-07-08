import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { supabase } from '../lib/supabase'

const PHASES = ['APS','APD','PC','PRO','DCE','ACT','EXE','OPR','AOR']

function dateFR(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR')
}

export default function FicheControle() {
  const navigate = useNavigate()
  const { id, cid } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE', reference: '' }
  const isNouveau = cid === 'nouveau'
  const fileRef = useRef()

  const [form, setForm] = useState({
    designation: '',
    realise_par: 'MOE',
    resultat: 'Conforme',
    date_controle: '',
    type_controle: 'Total',
    logements_controles: '',
    commentaire: '',
  })
  const [photos, setPhotos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modifie, setModifie] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [photoAgrandie, setPhotoAgrandie] = useState(null)

  useEffect(() => {
    if (!isNouveau && cid) charger()
  }, [cid])

  async function charger() {
    const { data } = await supabase.from('controles').select('*').eq('id', cid).single()
    if (data) {
      setForm({
        designation:         data.designation      || data.titre || '',
        realise_par:         data.realise_par       || 'MOE',
        resultat:            data.resultat          || 'Conforme',
        date_controle:       data.date_controle     || '',
        type_controle:       data.type_controle     || 'Total',
        logements_controles: data.logements_controles || '',
        commentaire:         data.commentaire       || '',
      })
      setPhotos(data.photos || [])
      setModifie(data.updated_at || null)
    }
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function enregistrer() {
    setSaving(true)
    setErreur(null)
    const now = new Date().toISOString()

    if (isNouveau) {
      const { data, error } = await supabase.from('controles').insert({
        projet_id:           id,
        designation:         form.designation,
        realise_par:         form.realise_par,
        resultat:            form.resultat,
        date_controle:       form.date_controle || null,
        type_controle:       form.type_controle,
        logements_controles: form.logements_controles,
        commentaire:         form.commentaire,
        photos:              photos,
        created_at:          now,
        updated_at:          now,
      }).select().single()
      if (error) { setErreur('Erreur : ' + error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('controles').update({
        designation:         form.designation,
        realise_par:         form.realise_par,
        resultat:            form.resultat,
        date_controle:       form.date_controle || null,
        type_controle:       form.type_controle,
        logements_controles: form.logements_controles,
        commentaire:         form.commentaire,
        photos:              photos,
        updated_at:          now,
      }).eq('id', cid)
      if (error) { setErreur('Erreur : ' + error.message); setSaving(false); return }
    }

    setSaving(false)
    navigate(`/projet/${id}/controles`, { state: { projet } })
  }

  async function handlePhotos(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    e.target.value = ''
    setUploading(true)
    const nouvellesUrls = []
    for (const file of files) {
      const ext = file.name.split('.').pop()
      const path = `controles/${id}/${cid || 'nouveau'}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('Photos').upload(path, file)
      if (!error) {
        const { data: urlData } = supabase.storage.from('Photos').getPublicUrl(path)
        nouvellesUrls.push(urlData.publicUrl)
      }
    }
    setPhotos(p => [...p, ...nouvellesUrls])
    setUploading(false)
  }

  function supprimerPhoto(url) {
    setPhotos(p => p.filter(u => u !== url))
  }

  function imprimer() {
    const BADGE_RESULTAT = {
      'Conforme':      { bg: '#EAF3DE', color: '#3B6D11' },
      'Sous réserves': { bg: '#FAEEDA', color: '#854F0B' },
      'Non conforme':  { bg: '#FCEBEB', color: '#A32D2D' },
    }
    const br = BADGE_RESULTAT[form.resultat] || { bg: '#eee', color: '#333' }

    const photosHtml = photos.length > 0 ? `
      <div class="section">Photos (${photos.length})</div>
      <div class="photos-grid">
        ${photos.map(url => `<img src="${url}" class="photo" />`).join('')}
      </div>
    ` : ''

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Contrôle Qualité — ${form.designation}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #FF8C00; padding-bottom: 12px; margin-bottom: 20px; }
    .logo { font-size: 18px; font-weight: 700; color: #FF8C00; }
    .titre { font-size: 18px; font-weight: 700; margin-bottom: 3px; }
    .meta { font-size: 11px; color: #888; }
    .badge { display: inline-block; font-size: 11px; padding: 3px 10px; border-radius: 20px; font-weight: 500; background: ${br.bg}; color: ${br.color}; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .field { margin-bottom: 10px; }
    .label { font-size: 10px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
    .value { font-size: 12px; padding: 6px 10px; background: #f8f8f8; border-radius: 4px; }
    .section { font-size: 10px; font-weight: 700; color: #FF8C00; text-transform: uppercase; letter-spacing: 0.5px; margin: 16px 0 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    .comment { font-size: 12px; color: #444; padding: 10px; background: #f8f8f8; border-radius: 4px; line-height: 1.6; }
    .photos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .photo { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 4px; }
    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #eee; font-size: 10px; color: #aaa; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Oslo Architectes</div>
      <div class="titre">${form.designation || '—'}</div>
      <div class="meta">${projet.nom} · ${projet.reference || ''} · Phase ${projet.phase}</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:10px;color:#aaa;margin-bottom:4px">Résultat</div>
      <span class="badge">${form.resultat}</span>
    </div>
  </div>
  <div class="grid">
    <div>
      <div class="field"><div class="label">Réalisé par</div><div class="value">${form.realise_par}</div></div>
      <div class="field"><div class="label">Type de contrôle</div><div class="value">${form.type_controle}</div></div>
    </div>
    <div>
      <div class="field"><div class="label">Date</div><div class="value">${form.date_controle ? dateFR(form.date_controle) : '—'}</div></div>
      ${form.type_controle === 'Échantillonnage' && form.logements_controles ? `<div class="field"><div class="label">Logements contrôlés</div><div class="value">${form.logements_controles}</div></div>` : ''}
    </div>
  </div>
  ${form.commentaire ? `<div class="section">Commentaire</div><div class="comment">${form.commentaire}</div>` : ''}
  ${photosHtml}
  <div class="footer">Généré le ${new Date().toLocaleDateString('fr-FR')}</div>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`

    const w = window.open('', '_blank')
    w.document.write(html)
    w.document.close()
  }

  const BADGE_RESULTAT_COLORS = {
    'Conforme':      { bg: '#EAF3DE', color: '#3B6D11' },
    'Sous réserves': { bg: '#FAEEDA', color: '#854F0B' },
    'Non conforme':  { bg: '#FCEBEB', color: '#A32D2D' },
  }
  const bc = BADGE_RESULTAT_COLORS[form.resultat] || {}

  return (
    <div className="page">
      <Topbar
        breadcrumb={[
          { label: 'Mes projets', path: '/' },
          { label: projet.nom, path: `/projet/${id}` },
          { label: 'Contrôles Qualité', path: `/projet/${id}/controles` },
          { label: isNouveau ? 'Nouveau contrôle' : (form.designation || 'Fiche') },
        ]}
        phase={projet.phase}
      />
      <div className="content">
        {/* Barre infos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {modifie && (
              <div className="modif-bar" style={{ margin: 0 }}>● Modifié le {dateFR(modifie)}</div>
            )}
            {form.resultat && (
              <span className="badge" style={{ background: bc.bg, color: bc.color }}>{form.resultat}</span>
            )}
          </div>
          {/* Bouton impression */}
          {!isNouveau && (
            <button
              onClick={imprimer}
              title="Imprimer en PDF"
              style={{
                background: 'var(--fond)', border: '1px solid var(--bordure)',
                borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'var(--texte-sec)', fontSize: 13, fontFamily: 'inherit'
              }}
            >
              🖨️ Imprimer PDF
            </button>
          )}
        </div>

        {erreur && (
          <div style={{ background: '#FCEBEB', border: '1px solid #F09595', color: '#A32D2D', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
            {erreur}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Désignation *</label>
          <input className="form-input" value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="Ex: Contrôle étanchéité toiture — Bât. A" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Réalisé par</label>
            <select className="form-input" value={form.realise_par} onChange={e => set('realise_par', e.target.value)}>
              <option>MOE</option>
              <option>Entreprise</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Résultat</label>
            <select className="form-input" value={form.resultat} onChange={e => set('resultat', e.target.value)}>
              <option>Conforme</option>
              <option>Sous réserves</option>
              <option>Non conforme</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Date du contrôle</label>
            <input className="form-input" type="date" value={form.date_controle} onChange={e => set('date_controle', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Type de contrôle</label>
            <select className="form-input" value={form.type_controle} onChange={e => set('type_controle', e.target.value)}>
              <option>Total</option>
              <option>Échantillonnage</option>
            </select>
          </div>
        </div>

        {form.type_controle === 'Échantillonnage' && (
          <div className="form-group">
            <label className="form-label">Logements / zones contrôlés</label>
            <input className="form-input" value={form.logements_controles} onChange={e => set('logements_controles', e.target.value)} placeholder="Ex: 12, 14, 18" />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Commentaire</label>
          <textarea className="form-input" value={form.commentaire} onChange={e => set('commentaire', e.target.value)} rows={4} />
        </div>

        {/* Upload photos */}
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
                  <img
                    src={url}
                    alt=""
                    className="photo-thumb"
                    style={{ cursor: 'zoom-in' }}
                    onClick={() => setPhotoAgrandie(url)}
                  />
                  <button
                    onClick={() => supprimerPhoto(url)}
                    style={{
                      position: 'absolute', top: 4, right: 4,
                      background: 'rgba(0,0,0,0.55)', color: 'white',
                      border: 'none', borderRadius: '50%',
                      width: 22, height: 22, cursor: 'pointer',
                      fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="btn-row">
          <button className="btn-save" onClick={enregistrer} disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <button className="btn-cancel" onClick={() => navigate(`/projet/${id}/controles`, { state: { projet } })}>
            Annuler
          </button>
        </div>
      </div>

      {/* Lightbox photo agrandie */}
      {photoAgrandie && (
        <div
          onClick={() => setPhotoAgrandie(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20, cursor: 'zoom-out'
          }}
        >
          <img
            src={photoAgrandie}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 8, objectFit: 'contain' }}
          />
          <button
            onClick={() => setPhotoAgrandie(null)}
            style={{
              position: 'fixed', top: 16, right: 16,
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: 'white', width: 36, height: 36, borderRadius: '50%',
              fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >×</button>
        </div>
      )}
    </div>
  )
}
