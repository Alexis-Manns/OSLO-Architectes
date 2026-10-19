import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Pour ajouter, supprimer ou renommer un rôle, modifie uniquement cette liste.
const ROLES_COLLABORATEUR = [
  'Associé(e)',
  'Responsable pôle conception',
  'Responsable pôle chantier',
  'Responsable de projet',
  'Responsable de chantier',
  'Responsable de projet & chantier',
  'Chargé(e) de chantier',
  'Développeur(euse) de projet',
  'Infographiste 3D',
  'Assistante administrative',
]

const CATEGORIE_COLORS = {
  'DTU':           { bg: '#EEEDFE', color: '#534AB7' },
  'Guide interne': { bg: '#EAF3DE', color: '#3B6D11' },
  'Courriel type': { bg: '#FAEEDA', color: '#854F0B' },
}

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
            {form.role && !ROLES_COLLABORATEUR.includes(form.role) && (
              <option value={form.role}>{form.role} (actuel)</option>
            )}
            {ROLES_COLLABORATEUR.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
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
  const entrepriseInitiale = contactInitial.entreprises || location.state?.entreprise || null

  const [form, setForm] = useState({
    prenom:                  contactInitial.prenom    || '',
    nom:                     contactInitial.nom       || '',
    fonction:                contactInitial.fonction  || '',
    telephone:               contactInitial.telephone || '',
    email:                   contactInitial.email     || '',
    note:                    contactInitial.note      || '',
    entreprise_id:           String(contactInitial.entreprise_id || entrepriseInitiale?.id || ''),
    interlocuteur_principal: contactInitial.interlocuteur_principal ? 'Oui' : 'Non',
  })
  const [entrepriseOriginale, setEntrepriseOriginale] = useState(entrepriseInitiale)
  const [entreprises, setEntreprises] = useState([])
  const [modeEntreprise, setModeEntreprise] = useState('existante')
  const [nouvelleEntreprise, setNouvelleEntreprise] = useState({ nom: '', type: '', siret: '', adresse: '' })
  const [chargementContact, setChargementContact] = useState(true)
  const [contactCharge, setContactCharge] = useState(false)
  const [erreurChargement, setErreurChargement] = useState(null)
  const [tentativeContact, setTentativeContact] = useState(0)
  const [chargementEntreprises, setChargementEntreprises] = useState(true)
  const [erreurEntreprises, setErreurEntreprises] = useState(null)
  const [tentativeEntreprises, setTentativeEntreprises] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [modifie, setModifie] = useState(null)
  const enregistrementEnCours = useRef(false)

  useEffect(() => {
    let actif = true
    async function charger() {
      setChargementContact(true)
      setContactCharge(false)
      setErreurChargement(null)
      setErreur(null)
      setSaved(false)
      setModeEntreprise('existante')
      setNouvelleEntreprise({ nom: '', type: '', siret: '', adresse: '' })
      try {
        if (!cid) throw new Error('Le contact est introuvable.')
        // La base fait référence, même après un rechargement sans état de navigation.
        const { data, error } = await supabase
          .from('contacts')
          .select('*, entreprises(*)')
          .eq('id', cid)
          .single()
        if (!actif) return
        if (error) throw error
        if (!data) throw new Error('Le contact est introuvable.')
        setForm({
          prenom:                  data.prenom    || '',
          nom:                     data.nom       || '',
          fonction:                data.fonction  || '',
          telephone:               data.telephone || '',
          email:                   data.email     || '',
          note:                    data.note      || '',
          entreprise_id:           String(data.entreprise_id || ''),
          interlocuteur_principal: data.interlocuteur_principal ? 'Oui' : 'Non',
        })
        setEntrepriseOriginale(data.entreprises || (data.entreprise_id
          ? { id: data.entreprise_id, nom: 'Entreprise actuelle' }
          : null))
        setModifie(data.updated_at || null)
        setContactCharge(true)
      } catch (error) {
        if (actif) setErreurChargement('Impossible de charger la fiche : ' + (error.message || 'veuillez réessayer.'))
      } finally {
        if (actif) setChargementContact(false)
      }
    }
    charger()
    return () => { actif = false }
  }, [cid, tentativeContact])

  useEffect(() => {
    let actif = true
    async function chargerEntreprises() {
      setChargementEntreprises(true)
      setErreurEntreprises(null)
      try {
        // Charger aussi les entreprises qui ne sont pas encore liées au projet.
        const liste = []
        const taillePage = 500
        for (let debut = 0; ; debut += taillePage) {
          const { data, error } = await supabase
            .from('entreprises')
            .select('*')
            .order('nom')
            .order('id')
            .range(debut, debut + taillePage - 1)
          if (!actif) return
          if (error) throw error
          liste.push(...(data || []))
          if (!data || data.length < taillePage) break
        }
        if (actif) setEntreprises(liste)
      } catch {
        if (actif) setErreurEntreprises('Impossible de charger les entreprises. Vous pouvez réessayer sans perdre les modifications de la fiche.')
      } finally {
        if (actif) setChargementEntreprises(false)
      }
    }
    chargerEntreprises()
    return () => { actif = false }
  }, [tentativeEntreprises])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setEntreprise = (k, v) => setNouvelleEntreprise(e => ({ ...e, [k]: v }))
  const entrepriseSelectionnee = entreprises.find(e => String(e.id) === form.entreprise_id)
    || (String(entrepriseOriginale?.id) === form.entreprise_id ? entrepriseOriginale : null)
  const entrepriseChangee = modeEntreprise === 'nouvelle'
    || form.entreprise_id !== String(entrepriseOriginale?.id || '')
  const nomEntreprise = modeEntreprise === 'nouvelle'
    ? nouvelleEntreprise.nom.trim() || 'Nouvelle entreprise'
    : entrepriseSelectionnee?.nom

  function retourner(entrepriseId = entrepriseOriginale?.id) {
    navigate(`/projet/${id}/collaborateurs`, {
      state: { projet, onglet: 'entreprises', entrepriseId }
    })
  }

  async function enregistrer(event) {
    event.preventDefault()
    if (!contactCharge || saving || saved || enregistrementEnCours.current) return
    if (modeEntreprise === 'nouvelle' && !nouvelleEntreprise.nom.trim()) {
      setErreur('Indiquez le nom de la nouvelle entreprise.')
      return
    }
    if (modeEntreprise === 'existante' && !entrepriseSelectionnee) {
      setErreur('Choisissez une entreprise ou créez-en une.')
      return
    }

    enregistrementEnCours.current = true
    setSaving(true)
    setErreur(null)
    let entrepriseCreee = null
    try {
      let entrepriseId = entrepriseSelectionnee?.id
      if (modeEntreprise === 'nouvelle') {
        const { data, error } = await supabase
          .from('entreprises')
          .insert({
            nom: nouvelleEntreprise.nom.trim(),
            type: nouvelleEntreprise.type.trim(),
            siret: nouvelleEntreprise.siret.trim(),
            adresse: nouvelleEntreprise.adresse.trim(),
          })
          .select('*')
          .single()
        if (error) throw error
        if (!data?.id) throw new Error('La création de l’entreprise n’a pas été confirmée.')
        entrepriseCreee = data
        entrepriseId = data.id
        // Si l’enregistrement du contact échoue ensuite, garder cette entreprise
        // sélectionnée pour réessayer sans en créer une deuxième.
        setEntreprises(liste => [...liste.filter(e => String(e.id) !== String(data.id)), data]
          .sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr')))
        setForm(f => ({ ...f, entreprise_id: String(data.id) }))
        setModeEntreprise('existante')
        setNouvelleEntreprise({ nom: '', type: '', siret: '', adresse: '' })
      }

      const now = new Date().toISOString()
      const { data, error } = await supabase.from('contacts').update({
        prenom:                  form.prenom,
        nom:                     form.nom,
        fonction:                form.fonction,
        telephone:               form.telephone,
        email:                   form.email,
        note:                    form.note,
        entreprise_id:           entrepriseId,
        interlocuteur_principal: form.interlocuteur_principal === 'Oui',
        updated_at:              now,
      }).eq('id', cid).select('id').maybeSingle()
      if (error) throw error
      if (!data) throw new Error('Le contact est introuvable ou vous ne pouvez pas le modifier.')

      // Aucun changement des affectations, rôles ou lots sur les projets.
      setModifie(now)
      setSaved(true)
      retourner(entrepriseId)
    } catch (error) {
      const message = error.message || 'Vérifiez vos droits et réessayez.'
      setErreur(entrepriseCreee
        ? 'L’entreprise a été créée et reste sélectionnée, mais la fiche n’a pas pu être enregistrée. Réessayez. ' + message
        : 'Enregistrement impossible : ' + message)
    } finally {
      enregistrementEnCours.current = false
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <Topbar breadcrumb={[
        { label: 'Mes projets', path: '/' },
        { label: projet.nom, path: `/projet/${id}` },
        { label: 'Collaborateurs', path: `/projet/${id}/collaborateurs` },
        { label: `${form.prenom} ${form.nom}`.trim() || 'Fiche contact' },
      ]} phase={projet.phase} />
      <div className="content">
        {modifie && <div className="modif-bar">● Modifié le {new Date(modifie).toLocaleDateString('fr-FR')}</div>}
        {chargementContact && <div className="loading" role="status">Chargement de la fiche…</div>}
        {erreurChargement && (
          <div role="alert" style={{ background: '#FCEBEB', color: '#A32D2D', padding: 12, borderRadius: 8, marginBottom: 14, fontSize: 13 }}>
            {erreurChargement}
            <button type="button" className="btn-cancel" style={{ marginLeft: 8 }} onClick={() => setTentativeContact(n => n + 1)}>Réessayer</button>
          </div>
        )}
        {erreur && <div role="alert" style={{ background: '#FCEBEB', border: '1px solid #F09595', color: '#A32D2D', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{erreur}</div>}

        <div className="fiche-header">
          <Avatar nom={form.nom} prenom={form.prenom} size={52} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{form.prenom} {form.nom}</div>
            {nomEntreprise && <span className="badge badge-ambre">{nomEntreprise}</span>}
          </div>
        </div>

        <form onSubmit={enregistrer}>
          <fieldset disabled={saving || saved || !contactCharge} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            <div style={{ border: '1px solid var(--bordure)', borderRadius: 10, padding: 14, marginBottom: 18 }}>
              {modeEntreprise === 'existante' ? (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="contact-entreprise">Entreprise *</label>
                    <select
                      id="contact-entreprise"
                      className="form-input"
                      required
                      value={form.entreprise_id}
                      onChange={e => set('entreprise_id', e.target.value)}
                      disabled={chargementEntreprises || !!erreurEntreprises}
                    >
                      <option value="" disabled>— Choisir une entreprise —</option>
                      {entrepriseOriginale && !entreprises.some(e => String(e.id) === String(entrepriseOriginale.id)) && (
                        <option value={String(entrepriseOriginale.id)}>{entrepriseOriginale.nom}</option>
                      )}
                      {entreprises.map(e => <option key={e.id} value={String(e.id)}>{e.nom}</option>)}
                    </select>
                    {chargementEntreprises && <div role="status" style={{ fontSize: 12, marginTop: 6 }}>Chargement des entreprises…</div>}
                  </div>
                  <button type="button" className="btn-add" style={{ margin: 0 }} onClick={() => setModeEntreprise('nouvelle')}>+ Créer une entreprise</button>
                </>
              ) : (
                <>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Nouvelle entreprise</div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="entreprise-nom">Nom de l’entreprise *</label>
                    <input id="entreprise-nom" className="form-input" required value={nouvelleEntreprise.nom} onChange={e => setEntreprise('nom', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="entreprise-type">Type / Lot</label>
                    <input id="entreprise-type" className="form-input" placeholder="Gros œuvre, Électricité, BET…" value={nouvelleEntreprise.type} onChange={e => setEntreprise('type', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="entreprise-siret">SIRET</label>
                    <input id="entreprise-siret" className="form-input" value={nouvelleEntreprise.siret} onChange={e => setEntreprise('siret', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="entreprise-adresse">Adresse</label>
                    <input id="entreprise-adresse" className="form-input" value={nouvelleEntreprise.adresse} onChange={e => setEntreprise('adresse', e.target.value)} />
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--texte-sec)' }}>L’entreprise sera créée lors de l’enregistrement de la fiche.</p>
                  <button type="button" className="btn-cancel" onClick={() => setModeEntreprise('existante')}>Choisir une entreprise existante</button>
                </>
              )}
              {erreurEntreprises && (
                <div role="alert" style={{ color: '#A32D2D', fontSize: 12, marginTop: 10 }}>
                  {erreurEntreprises}
                  <button type="button" className="btn-cancel" style={{ marginLeft: 8 }} onClick={() => setTentativeEntreprises(n => n + 1)}>Réessayer</button>
                </div>
              )}
            </div>

            {entrepriseChangee && (
              <div style={{ background: '#FAEEDA', color: '#854F0B', padding: 12, borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                Pensez à mettre à jour l’email, le téléphone et la fonction. Ces modifications s’appliqueront à tous les projets utilisant ce contact.
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group"><label className="form-label" htmlFor="contact-prenom">Prénom</label><input id="contact-prenom" className="form-input" value={form.prenom} onChange={e => set('prenom', e.target.value)} /></div>
              <div className="form-group"><label className="form-label" htmlFor="contact-nom">Nom</label><input id="contact-nom" className="form-input" value={form.nom} onChange={e => set('nom', e.target.value)} /></div>
            </div>
            <div className="form-group"><label className="form-label" htmlFor="contact-fonction">Fonction</label><input id="contact-fonction" className="form-input" value={form.fonction} onChange={e => set('fonction', e.target.value)} /></div>
            <div className="form-group"><label className="form-label" htmlFor="contact-telephone">Téléphone</label><input id="contact-telephone" className="form-input" type="tel" value={form.telephone} onChange={e => set('telephone', e.target.value)} /></div>
            <div className="form-group"><label className="form-label" htmlFor="contact-email">Email</label><input id="contact-email" className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-group">
              <label className="form-label" htmlFor="contact-principal">Interlocuteur principal</label>
              <select id="contact-principal" className="form-input" value={form.interlocuteur_principal} onChange={e => set('interlocuteur_principal', e.target.value)}>
                <option>Non</option><option>Oui</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label" htmlFor="contact-note">Note</label><textarea id="contact-note" className="form-input" value={form.note} onChange={e => set('note', e.target.value)} /></div>
          </fieldset>
          <div className="btn-row">
            <button type="submit" className="btn-save" disabled={saving || saved || !contactCharge}>{saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}</button>
            <button type="button" className="btn-cancel" disabled={saving || saved} onClick={() => retourner()}>Annuler</button>
          </div>
        </form>
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
  const { peutModifierCollabs, profil, deconnexion } = useAuth()

  const [guide, setGuide] = useState(location.state?.guide || null)
  const [loading, setLoading] = useState(!location.state?.guide)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!guide && gid) charger()
  }, [gid])

  async function charger() {
    setLoading(true)
    const { data } = await supabase.from('guides').select('*').eq('id', gid).single()
    setGuide(data)
    setLoading(false)
  }

  // Sauvegarde d'un champ modifié
  async function sauvegarder(champ, valeur) {
    if (!peutModifierCollabs) return
    setSaving(true)
    const maj = { [champ]: valeur }
    const { data } = await supabase.from('guides').update(maj).eq('id', gid).select().single()
    if (data) setGuide(data)
    setSaving(false)
  }

  function ajouterPointCle() {
    const nv = [...(guide.points_cles || []), 'Nouveau point à préciser']
    sauvegarder('points_cles', nv)
  }

  function modifierPointCle(index, valeur) {
    const nv = [...(guide.points_cles || [])]
    nv[index] = valeur
    sauvegarder('points_cles', nv)
  }

  function supprimerPointCle(index) {
    const nv = [...(guide.points_cles || [])]
    nv.splice(index, 1)
    sauvegarder('points_cles', nv)
  }

  if (loading) return (
    <div className="page">
      <Topbar breadcrumb={[
        { label: 'Mes projets', path: '/' },
        { label: projet.nom, path: `/projet/${id}` },
        { label: 'Guides', path: `/projet/${id}/guides` },
        { label: 'Fiche' },
      ]} phase={projet.phase} profil={profil} onDeconnexion={deconnexion} />
      <div className="content"><div className="loading">Chargement...</div></div>
    </div>
  )

  if (!guide) return null
  const cc = CATEGORIE_COLORS[guide.categorie] || {}
  const editable = peutModifierCollabs

  return (
    <div className="page">
      <Topbar breadcrumb={[
        { label: 'Mes projets', path: '/' },
        { label: projet.nom, path: `/projet/${id}` },
        { label: 'Guides', path: `/projet/${id}/guides` },
        { label: guide.reference || guide.titre },
      ]} phase={projet.phase} profil={profil} onDeconnexion={deconnexion} />
      <div className="content" style={{ maxWidth: 760 }}>
        {/* Barre édition */}
        {editable && (
          <div style={{ fontSize: 12, color: '#FF8C00', marginBottom: 10, fontWeight: 500 }}>
            ✎ Mode édition — cliquez sur les champs pour les modifier
            {saving && <span style={{ marginLeft: 10, color: 'var(--texte-sec)' }}>Sauvegarde...</span>}
          </div>
        )}

        {/* Header fiche */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: cc.bg, color: cc.color, fontSize: 12 }}>{guide.categorie}</span>
            {editable ? (
              <input
                defaultValue={guide.reference || ''}
                onBlur={e => e.target.value !== guide.reference && sauvegarder('reference', e.target.value)}
                placeholder="Référence"
                style={{ border: '1px dashed var(--bordure)', borderRadius: 4, padding: '2px 8px', fontSize: 13, color: 'var(--texte-sec)', fontWeight: 500, fontFamily: 'inherit', background: 'transparent', maxWidth: 200 }}
              />
            ) : (
              guide.reference && <span style={{ fontSize: 13, color: 'var(--texte-sec)', fontWeight: 500 }}>{guide.reference}</span>
            )}
          </div>
          {editable ? (
            <textarea
              defaultValue={guide.titre}
              onBlur={e => e.target.value !== guide.titre && sauvegarder('titre', e.target.value)}
              placeholder="Titre du guide"
              rows={1}
              style={{ fontSize: 20, fontWeight: 700, color: 'var(--texte)', lineHeight: 1.3, width: '100%', border: '1px dashed var(--bordure)', borderRadius: 6, padding: '6px 10px', fontFamily: 'inherit', resize: 'vertical', background: 'transparent' }}
            />
          ) : (
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--texte)', lineHeight: 1.3 }}>{guide.titre}</div>
          )}
        </div>

        {/* Résumé */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#FF8C00', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Résumé</div>
          {editable ? (
            <textarea
              defaultValue={guide.resume || ''}
              onBlur={e => e.target.value !== guide.resume && sauvegarder('resume', e.target.value)}
              placeholder="Résumé du guide..."
              rows={4}
              style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--texte)', width: '100%', border: '1px dashed var(--bordure)', borderRadius: 6, padding: 10, fontFamily: 'inherit', resize: 'vertical', background: 'transparent' }}
            />
          ) : (
            guide.resume && <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--texte)' }}>{guide.resume}</div>
          )}
        </div>

        {/* Points clés */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FF8C00', textTransform: 'uppercase', letterSpacing: 0.5 }}>Points clés et vigilances MOE</div>
            {editable && (
              <button onClick={ajouterPointCle} style={{ background: 'none', border: '1px solid var(--bordure)', color: 'var(--texte-sec)', fontSize: 12, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}>+ Ajouter</button>
            )}
          </div>
          {(guide.points_cles || []).length === 0 && !editable && (
            <div style={{ fontSize: 13, color: 'var(--texte-sec)', fontStyle: 'italic' }}>Aucun point clé.</div>
          )}
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
            {(guide.points_cles || []).map((p, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--bordure)', fontSize: 13, lineHeight: 1.6 }}>
                <span style={{ color: '#FF8C00', fontWeight: 700, flexShrink: 0 }}>•</span>
                {editable ? (
                  <>
                    <textarea
                      defaultValue={p}
                      onBlur={e => e.target.value !== p && modifierPointCle(i, e.target.value)}
                      rows={1}
                      style={{ flex: 1, border: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.6, resize: 'vertical', padding: 0, outline: 'none' }}
                      onFocus={e => e.target.style.background = '#FFF8F0'}
                      onBlurCapture={e => e.target.style.background = 'transparent'}
                    />
                    <button onClick={() => supprimerPointCle(i)} style={{ background: 'none', border: 'none', color: '#ddd', fontSize: 14, cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#E24B4A'}
                      onMouseLeave={e => e.currentTarget.style.color = '#ddd'}>✕</button>
                  </>
                ) : (
                  <span>{p}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Tolérances */}
        <div style={{ marginBottom: 20, padding: 14, background: '#FFF8F0', border: '1px solid #FAEEDA', borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#854F0B', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Tolérances</div>
          {editable ? (
            <textarea
              defaultValue={guide.tolerances || ''}
              onBlur={e => e.target.value !== guide.tolerances && sauvegarder('tolerances', e.target.value)}
              placeholder="Tolérances chiffrées..."
              rows={3}
              style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--texte)', width: '100%', border: '1px dashed rgba(133,79,11,0.3)', borderRadius: 6, padding: 8, fontFamily: 'inherit', resize: 'vertical', background: 'transparent' }}
            />
          ) : (
            guide.tolerances && <div style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--texte)' }}>{guide.tolerances}</div>
          )}
        </div>

        {/* Contenu libre — utile pour guides internes et courriels */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#FF8C00', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Contenu détaillé</div>
          {editable ? (
            <textarea
              defaultValue={guide.contenu || ''}
              onBlur={e => e.target.value !== guide.contenu && sauvegarder('contenu', e.target.value)}
              placeholder="Contenu du guide, texte du courriel, procédure détaillée..."
              rows={8}
              style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--texte)', width: '100%', border: '1px dashed var(--bordure)', borderRadius: 6, padding: 10, fontFamily: 'inherit', resize: 'vertical', background: 'transparent', whiteSpace: 'pre-wrap' }}
            />
          ) : (
            guide.contenu && <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', color: 'var(--texte)' }}>{guide.contenu}</div>
          )}
        </div>

        <div className="btn-row">
          <button className="btn-cancel" onClick={() => navigate(`/projet/${id}/guides`, { state: { projet } })}>Retour</button>
        </div>
      </div>
    </div>
  )
}
