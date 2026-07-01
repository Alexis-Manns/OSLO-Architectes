import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import { supabase } from '../lib/supabase'

// ─── Fiche Collaborateur ───────────────────────────────────────────────────
export function FicheCollaborateur() {
  const navigate = useNavigate()
  const { id, cid } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }
  const collabInitial = location.state?.collab || {}

  const [form, setForm] = useState({
    prenom:    collabInitial.prenom    || '',
    nom:       collabInitial.nom       || '',
    email:     collabInitial.email     || '',
    telephone: collabInitial.telephone || '',
    role:      collabInitial.role      || '',
    specialite:collabInitial.specialite|| '',
  })
  const [roleProjet, setRoleProjet] = useState(collabInitial.role_projet || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [modifie, setModifie] = useState(collabInitial.updated_at || null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function enregistrer() {
    setSaving(true)
    const now = new Date().toISOString()

    // Mise à jour de la fiche globale dans collaborateurs
    const { error } = await supabase
      .from('collaborateurs')
      .update({
        prenom:     form.prenom,
        nom:        form.nom,
        email:      form.email,
        telephone:  form.telephone,
        role:       form.role,
        specialite: form.specialite,
        updated_at: now,
      })
      .eq('id', cid)

    // Mise à jour du rôle sur ce projet spécifique
    if (collabInitial.affectation_id) {
      await supabase
        .from('affectations')
        .update({ role_sur_projet: roleProjet })
        .eq('id', collabInitial.affectation_id)
    }

    if (!error) {
      setModifie(now)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  return (
    <div className="page">
      <Topbar breadcrumb={[
        { label: 'Mes projets', path: '/' },
        { label: projet.nom, path: `/projet/${id}` },
        { label: 'Collaborateurs', path: `/projet/${id}/collaborateurs` },
        { label: `${form.prenom} ${form.nom}` },
      ]} phase={projet.phase} />
      <div className="content">
        {modifie && (
          <div className="modif-bar">
            ● Modifié le {new Date(modifie).toLocaleDateString('fr-FR')}
          </div>
        )}
        <div className="fiche-header">
          <Avatar nom={form.nom} prenom={form.prenom} size={52} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{form.prenom} {form.nom}</div>
            {form.role && <span className="badge badge-violet">{form.role}</span>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Prénom</label>
            <input className="form-input" value={form.prenom} onChange={e => set('prenom', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Nom</label>
            <input className="form-input" value={form.nom} onChange={e => set('nom', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Téléphone</label>
          <input className="form-input" value={form.telephone} onChange={e => set('telephone', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Rôle général</label>
          <select className="form-input" value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="">—</option>
            <option>Associé</option>
            <option>Pilote référent</option>
            <option>Architecte</option>
            <option>Dessinateur</option>
            <option>Chef de projet</option>
            <option>Ingénieur</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Spécialité</label>
          <input className="form-input" value={form.specialite} onChange={e => set('specialite', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label" style={{ color: 'var(--orange)', fontWeight: 600 }}>
            Rôle sur ce projet
          </label>
          <input
            className="form-input"
            value={roleProjet}
            onChange={e => setRoleProjet(e.target.value)}
            style={{ borderColor: 'var(--orange)' }}
            placeholder="Ex: Cheffe de projet, Architecte exécution…"
          />
        </div>

        <div className="btn-row">
          <button className="btn-save" onClick={enregistrer} disabled={saving}>
            {saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}
          </button>
          <button className="btn-cancel" onClick={() => navigate(`/projet/${id}/collaborateurs`, { state: { projet } })}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Fiche Contact ─────────────────────────────────────────────────────────
export function FicheContact() {
  const navigate = useNavigate()
  const { id, cid } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }
  const contactInitial = location.state?.contact || {}
  const entreprise = location.state?.entreprise || {}

  const [form, setForm] = useState({
    prenom:                contactInitial.prenom                || '',
    nom:                   contactInitial.nom                   || '',
    fonction:              contactInitial.fonction              || '',
    telephone:             contactInitial.telephone             || '',
    email:                 contactInitial.email                 || '',
    note:                  contactInitial.note                  || '',
    interlocuteur_principal: contactInitial.interlocuteur_principal ? 'Oui' : 'Non',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [modifie, setModifie] = useState(contactInitial.updated_at || null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function enregistrer() {
    setSaving(true)
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('contacts')
      .update({
        prenom:                  form.prenom,
        nom:                     form.nom,
        fonction:                form.fonction,
        telephone:               form.telephone,
        email:                   form.email,
        note:                    form.note,
        interlocuteur_principal: form.interlocuteur_principal === 'Oui',
        updated_at:              now,
      })
      .eq('id', cid)

    if (!error) {
      setModifie(now)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  return (
    <div className="page">
      <Topbar breadcrumb={[
        { label: 'Mes projets', path: '/' },
        { label: projet.nom, path: `/projet/${id}` },
        { label: 'Collaborateurs', path: `/projet/${id}/collaborateurs` },
        { label: `${form.prenom} ${form.nom}` },
      ]} phase={projet.phase} />
      <div className="content">
        {modifie && (
          <div className="modif-bar">
            ● Modifié le {new Date(modifie).toLocaleDateString('fr-FR')}
          </div>
        )}
        <div className="fiche-header">
          <Avatar nom={form.nom} prenom={form.prenom} size={52} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{form.prenom} {form.nom}</div>
            {entreprise.nom && <span className="badge badge-ambre">{entreprise.nom}</span>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Prénom</label>
            <input className="form-input" value={form.prenom} onChange={e => set('prenom', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Nom</label>
            <input className="form-input" value={form.nom} onChange={e => set('nom', e.target.value)} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Fonction</label>
          <input className="form-input" value={form.fonction} onChange={e => set('fonction', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Téléphone</label>
          <input className="form-input" value={form.telephone} onChange={e => set('telephone', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Interlocuteur principal</label>
          <select className="form-input" value={form.interlocuteur_principal} onChange={e => set('interlocuteur_principal', e.target.value)}>
            <option>Non</option>
            <option>Oui</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Note</label>
          <textarea className="form-input" value={form.note} onChange={e => set('note', e.target.value)} />
        </div>

        <div className="btn-row">
          <button className="btn-save" onClick={enregistrer} disabled={saving}>
            {saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}
          </button>
          <button className="btn-cancel" onClick={() => navigate(`/projet/${id}/collaborateurs`, { state: { projet } })}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Fiche Guide ───────────────────────────────────────────────────────────
export function FicheGuide() {
  const navigate = useNavigate()
  const { id, gid } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }
  const g = location.state?.guide || {}

  const [form, setForm] = useState({
    titre:    g.titre    || '',
    categorie:g.categorie|| 'Normes / DTU',
    resume:   g.resume   || '',
    lien:     g.lien_document || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function enregistrer() {
    setSaving(true)
    const { error } = await supabase
      .from('guides')
      .update({
        titre:          form.titre,
        categorie:      form.categorie,
        resume:         form.resume,
        lien_document:  form.lien,
        updated_at:     new Date().toISOString(),
      })
      .eq('id', gid)
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    setSaving(false)
  }

  return (
    <div className="page">
      <Topbar breadcrumb={[
        { label: 'Mes projets', path: '/' },
        { label: projet.nom, path: `/projet/${id}` },
        { label: 'Guides', path: `/projet/${id}/guides` },
        { label: form.titre || 'Fiche guide' },
      ]} phase={projet.phase} />
      <div className="content">
        <div className="form-group"><label className="form-label">Titre</label><input className="form-input" value={form.titre} onChange={e => set('titre', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Catégorie</label>
          <select className="form-input" value={form.categorie} onChange={e => set('categorie', e.target.value)}>
            <option>Normes / DTU</option><option>Guides internes</option><option>Modèles courriers</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Résumé / Points clés</label><textarea className="form-input" value={form.resume} onChange={e => set('resume', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Lien document (URL)</label><input className="form-input" type="url" value={form.lien} onChange={e => set('lien', e.target.value)} placeholder="https://…" /></div>
        <div className="btn-row">
          <button className="btn-save" onClick={enregistrer} disabled={saving}>
            {saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}
          </button>
          <button className="btn-cancel" onClick={() => navigate(`/projet/${id}/guides`, { state: { projet } })}>Annuler</button>
        </div>
      </div>
    </div>
  )
}
