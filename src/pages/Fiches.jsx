import React, { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'

export function FicheCollaborateur() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }
  const c = location.state?.collab || {}
  const [form, setForm] = useState({ email: c.email || '', telephone: c.telephone || '', role: c.role_projet || '', specialite: c.specialite || 'Architecte' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="page">
      <Topbar breadcrumb={[
        { label: 'Mes projets', path: '/' },
        { label: projet.nom, path: `/projet/${id}` },
        { label: 'Collaborateurs', path: `/projet/${id}/collaborateurs` },
        { label: `${c.prenom} ${c.nom}` },
      ]} phase={projet.phase} />
      <div className="content">
        <div className="modif-bar">● Modifié le 28/05/2026 par T. Dubois</div>
        <div className="fiche-header">
          <Avatar nom={c.nom} prenom={c.prenom} size={52} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{c.prenom} {c.nom}</div>
            <span className="badge badge-violet">{c.role_projet}</span>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" value={form.telephone} onChange={e => set('telephone', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Rôle sur projet</label><input className="form-input" value={form.role} onChange={e => set('role', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Spécialité</label>
          <select className="form-input" value={form.specialite} onChange={e => set('specialite', e.target.value)}>
            <option>Architecte</option><option>Dessinateur</option><option>Chef de projet</option><option>Ingénieur</option>
          </select>
        </div>
        <div className="btn-row">
          <button className="btn-save" onClick={() => navigate(`/projet/${id}/collaborateurs`, { state: { projet } })}>Enregistrer</button>
          <button className="btn-cancel" onClick={() => navigate(`/projet/${id}/collaborateurs`, { state: { projet } })}>Annuler</button>
        </div>
      </div>
    </div>
  )
}

export function FicheContact() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }
  const c = location.state?.contact || {}
  const e = location.state?.entreprise || {}
  const [form, setForm] = useState({ fonction: c.fonction || '', telephone: c.telephone || '', email: c.email || '', interlocuteur: 'Oui', note: c.note || '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="page">
      <Topbar breadcrumb={[
        { label: 'Mes projets', path: '/' },
        { label: projet.nom, path: `/projet/${id}` },
        { label: 'Collaborateurs', path: `/projet/${id}/collaborateurs` },
        { label: `${c.prenom} ${c.nom}` },
      ]} phase={projet.phase} />
      <div className="content">
        <div className="modif-bar">● Modifié le 30/05/2026 par M. Laurent</div>
        <div className="fiche-header">
          <Avatar nom={c.nom} prenom={c.prenom} size={52} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{c.prenom} {c.nom}</div>
            <span className="badge badge-ambre">{e.nom}</span>
          </div>
        </div>
        <div className="form-group"><label className="form-label">Fonction</label><input className="form-input" value={form.fonction} onChange={e => set('fonction', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" value={form.telephone} onChange={e => set('telephone', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={form.email} onChange={e => set('email', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Interlocuteur principal</label>
          <select className="form-input" value={form.interlocuteur} onChange={e => set('interlocuteur', e.target.value)}><option>Oui</option><option>Non</option></select>
        </div>
        <div className="form-group"><label className="form-label">Note</label><textarea className="form-input" value={form.note} onChange={e => set('note', e.target.value)} /></div>
        <div className="btn-row">
          <button className="btn-save" onClick={() => navigate(`/projet/${id}/collaborateurs`, { state: { projet } })}>Enregistrer</button>
          <button className="btn-cancel" onClick={() => navigate(`/projet/${id}/collaborateurs`, { state: { projet } })}>Annuler</button>
        </div>
      </div>
    </div>
  )
}

export function FicheGuide() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }
  const g = location.state?.guide || {}
  const [form, setForm] = useState({ titre: g.titre || '', categorie: g.categorie || 'Normes / DTU', resume: g.resume || '', lien: g.lien || '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="page">
      <Topbar breadcrumb={[
        { label: 'Mes projets', path: '/' },
        { label: projet.nom, path: `/projet/${id}` },
        { label: 'Guides', path: `/projet/${id}/guides` },
        { label: form.titre || 'Fiche guide' },
      ]} phase={projet.phase} />
      <div className="content">
        <div className="modif-bar">● Modifié le 15/04/2026 par S. Chen</div>
        <div className="form-group"><label className="form-label">Titre</label><input className="form-input" value={form.titre} onChange={e => set('titre', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Catégorie</label>
          <select className="form-input" value={form.categorie} onChange={e => set('categorie', e.target.value)}>
            <option>Normes / DTU</option><option>Guides internes</option><option>Modèles courriers</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Résumé / Points clés</label><textarea className="form-input" value={form.resume} onChange={e => set('resume', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Lien document (URL)</label><input className="form-input" type="url" value={form.lien} onChange={e => set('lien', e.target.value)} placeholder="https://…" /></div>
        <div className="btn-row">
          <button className="btn-save" onClick={() => navigate(`/projet/${id}/guides`, { state: { projet } })}>Enregistrer</button>
          <button className="btn-cancel" onClick={() => navigate(`/projet/${id}/guides`, { state: { projet } })}>Annuler</button>
        </div>
      </div>
    </div>
  )
}
