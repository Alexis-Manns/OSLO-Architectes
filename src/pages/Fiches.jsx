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
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [erreur, setErreur] = useState(null)
  const [modifie, setModifie] = useState(null)

  useEffect(() => {
    async function charger() {
      const { data } = await supabase
        .from('collaborateurs')
        .select('*')
        .eq('id', cid)
        .single()
      if (data) {
        setForm({
          prenom:    data.prenom    || '',
          nom:       data.nom       || '',
          email:     data.email     || '',
          telephone: data.telephone || '',
          role:      data.role      || '',
        })
        setModifie(data.updated_at || null)
      }
    }
    if (cid) charger()
  }, [cid])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function enregistrer() {
    setSaving(true)
    setErreur(null)
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('collaborateurs')
      .update({
        prenom:     form.prenom,
        nom:        form.nom,
        email:      form.email,
        telephone:  form.telephone,
        role:       form.role,
        updated_at: now,
      })
      .eq('id', cid)

    if (error) { setErreur('Erreur : ' + error.message); setSaving(false); return }

    // Mettre à jour le rôle sur le projet
    if (collabInitial.affectation_id) {
      await supabase
        .from('affectations')
        .update({ role_sur_projet: form.role })
        .eq('id', collabInitial.affectation_id)
    }

    setModifie(now)
    setSaved(true)
    setTimeout(() => {
      navigate(`/projet/${id}/collaborateurs`, { state: { projet } })
    }, 800)
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
          <div className="modif-bar">● Modifié le {new Date(modifie).toLocaleDateString('fr-FR')}</div>
        )}
        {erreur && (
          <div style={{ background: '#FCEBEB', border: '1px solid #F09595', color: '#A32D2D', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{erreur}</div>
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
          <label className="form-label">Rôle</label>
          <select className="form-input" value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="">— Choisir un rôle —</option>
            <option>Associé</option>
            <option>Pilote référent</option>
            <option>Projeteur</option>
            <option>Chargé de chantier</option>
            <option>Responsable chantier</option>
          </select>
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
    prenom:                  contactInitial.prenom    || '',
    nom:                     contactInitial.nom       || '',
    fonction:                contactInitial.fonction  || '',
    telephone:               contactInitial.telephone || '',
    email:                   contactInitial.email     || '',
    note:                    contactInitial.note      || '',
    interlocuteur_principal: contactInitial.interlocuteur_principal ? 'Oui' : 'Non',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [erreur, setErreur] = useState(null)
  const [modifie, setModifie] = useState(null)

  useEffect(() => {
    async function charger() {
      const { data } = await supabase.from('contacts').select('*').eq('id', cid).single()
      if (data) {
        setForm({
          prenom:                  data.prenom    || '',
          nom:                     data.nom       || '',
          fonction:                data.fonction  || '',
          telephone:               data.telephone || '',
          email:                   data.email     || '',
          note:                    data.note      || '',
          interlocuteur_principal: data.interlocuteur_principal ? 'Oui' : 'Non',
        })
        setModifie(data.updated_at || null)
      }
    }
    if (cid) charger()
  }, [cid])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function enregistrer() {
    setSaving(true)
    setErreur(null)
    const now = new Date().toISOString()
    const { error } = await supabase.from('contacts').update({
      prenom:                  form.prenom,
      nom:                     form.nom,
      fonction:                form.fonction,
      telephone:               form.telephone,
      email:                   form.email,
      note:                    form.note,
      interlocuteur_principal: form.interlocuteur_principal === 'Oui',
      updated_at:              now,
    }).eq('id', cid)

    if (error) { setErreur('Erreur : ' + error.message); setSaving(false); return }
    setModifie(now)
    setSaved(true)
    setTimeout(() => {
      navigate(`/projet/${id}/collaborateurs`, { state: { projet } })
    }, 800)
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
        {modifie && <div className="modif-bar">● Modifié le {new Date(modifie).toLocaleDateString('fr-FR')}</div>}
        {erreur && <div style={{ background: '#FCEBEB', border: '1px solid #F09595', color: '#A32D2D', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{erreur}</div>}

        <div className="fiche-header">
          <Avatar nom={form.nom} prenom={form.prenom} size={52} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{form.prenom} {form.nom}</div>
            {entreprise.nom && <span className="badge badge-ambre">{entreprise.nom}</span>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group"><label className="form-label">Prénom</label><input className="form-input" value={form.prenom} onChange={e => set('prenom', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Nom</label><input className="form-input" value={form.nom} onChange={e => set('nom', e.target.value)} /></div>
        </div>
        <div className="form-group"><label className="form-label">Fonction</label><input className="form-input" value={form.fonction} onChange={e => set('fonction', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" value={form.telephone} onChange={e => set('telephone', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
        <div className="form-group">
          <label className="form-label">Interlocuteur principal</label>
          <select className="form-input" value={form.interlocuteur_principal} onChange={e => set('interlocuteur_principal', e.target.value)}>
            <option>Non</option><option>Oui</option>
          </select>
        </div>
        <div className="form-group"><label className="form-label">Note</label><textarea className="form-input" value={form.note} onChange={e => set('note', e.target.value)} /></div>

        <div className="btn-row">
          <button className="btn-save" onClick={enregistrer} disabled={saving}>
            {saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}
          </button>
          <button className="btn-cancel" onClick={() => navigate(`/projet/${id}/collaborateurs`, { state: { projet } })}>Annuler</button>
        </div>
      </div>
    </div>
  )
}

// ─── Fiche Guide ───────────────────────────────────────────────────────────
const CATEGORIE_COLORS = {
  'DTU':           { bg: '#EEEDFE', color: '#534AB7' },
  'Guide interne': { bg: '#EAF3DE', color: '#3B6D11' },
  'Courriel type': { bg: '#FAEEDA', color: '#854F0B' },
}
export function FicheGuide() {
  const navigate = useNavigate()
  const { id, gid } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }

  const [guide, setGuide] = useState(location.state?.guide || null)
  const [loading, setLoading] = useState(!location.state?.guide)

  useEffect(() => {
    if (!guide && gid) charger()
  }, [gid])

  async function charger() {
    setLoading(true)
    const { data } = await supabase.from('guides').select('*').eq('id', gid).single()
    setGuide(data)
    setLoading(false)
  }

  if (loading) return (
    <div className="page">
      <Topbar breadcrumb={[
        { label: 'Mes projets', path: '/' },
        { label: projet.nom, path: `/projet/${id}` },
        { label: 'Guides', path: `/projet/${id}/guides` },
        { label: 'Fiche' },
      ]} phase={projet.phase} />
      <div className="content"><div className="loading">Chargement...</div></div>
    </div>
  )

  if (!guide) return null
  const cc = CATEGORIE_COLORS[guide.categorie] || {}

  return (
    <div className="page">
      <Topbar breadcrumb={[
        { label: 'Mes projets', path: '/' },
        { label: projet.nom, path: `/projet/${id}` },
        { label: 'Guides', path: `/projet/${id}/guides` },
        { label: guide.reference || guide.titre },
      ]} phase={projet.phase} />
      <div className="content" style={{ maxWidth: 760 }}>
        {/* Header fiche */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: cc.bg, color: cc.color, fontSize: 12 }}>{guide.categorie}</span>
            {guide.reference && <span style={{ fontSize: 13, color: 'var(--texte-sec)', fontWeight: 500 }}>{guide.reference}</span>}
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--texte)', lineHeight: 1.3 }}>{guide.titre}</div>
        </div>

        {/* Résumé */}
        {guide.resume && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FF8C00', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Résumé</div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--texte)' }}>{guide.resume}</div>
          </div>
        )}

        {/* Points clés */}
        {guide.points_cles && guide.points_cles.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FF8C00', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Points clés et vigilances MOE</div>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {guide.points_cles.map((p, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--bordure)', fontSize: 13, lineHeight: 1.6 }}>
                  <span style={{ color: '#FF8C00', fontWeight: 700, flexShrink: 0 }}>•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Tolérances */}
        {guide.tolerances && (
          <div style={{ marginBottom: 20, padding: 14, background: '#FFF8F0', border: '1px solid #FAEEDA', borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#854F0B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Tolérances</div>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--texte)' }}>{guide.tolerances}</div>
          </div>
        )}

        {/* Contenu libre pour guides internes / courriels */}
        {guide.contenu && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FF8C00', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Contenu</div>
            <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--texte)' }}>{guide.contenu}</div>
          </div>
        )}

        <div className="btn-row">
          <button className="btn-cancel" onClick={() => navigate(`/projet/${id}/guides`, { state: { projet } })}>Retour</button>
        </div>
      </div>
    </div>
  )
}
