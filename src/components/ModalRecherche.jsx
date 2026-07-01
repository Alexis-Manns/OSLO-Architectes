import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import Avatar from './Avatar'

export default function ModalRecherche({ type, projetId, entreprise, onSelect, onClose }) {
  const [recherche, setRecherche] = useState('')
  const [resultats, setResultats] = useState([])
  const [loading, setLoading] = useState(false)
  const [vue, setVue] = useState('recherche') // 'recherche' | 'creer'
  const [form, setForm] = useState({})

  const titres = {
    collaborateur: 'Ajouter un collaborateur',
    contact: entreprise ? `Ajouter un contact — ${entreprise.nom}` : 'Ajouter un contact',
    entreprise: 'Ajouter une entreprise',
  }

  useEffect(() => {
    if (recherche.length >= 2) chercher()
    else setResultats([])
  }, [recherche])

  async function chercher() {
    setLoading(true)
    if (type === 'collaborateur') {
      const { data } = await supabase
        .from('collaborateurs')
        .select('*')
        .or(`nom.ilike.%${recherche}%,prenom.ilike.%${recherche}%,email.ilike.%${recherche}%`)
        .limit(10)
      setResultats(data || [])
    } else if (type === 'contact') {
      const { data } = await supabase
        .from('contacts')
        .select('*, entreprises(nom)')
        .or(`nom.ilike.%${recherche}%,prenom.ilike.%${recherche}%,fonction.ilike.%${recherche}%`)
        .limit(10)
      setResultats(data || [])
    } else if (type === 'entreprise') {
      const { data } = await supabase
        .from('entreprises')
        .select('*')
        .or(`nom.ilike.%${recherche}%,type.ilike.%${recherche}%`)
        .limit(10)
      setResultats(data || [])
    }
    setLoading(false)
  }

  async function creer() {
    setLoading(true)
    let nouvelElement = null

    if (type === 'collaborateur') {
      const { data } = await supabase
        .from('collaborateurs')
        .insert({ nom: form.nom, prenom: form.prenom, email: form.email, telephone: form.telephone, role: form.role, specialite: form.specialite })
        .select()
        .single()
      nouvelElement = data
    } else if (type === 'contact') {
      // Créer ou récupérer l'entreprise si pas d'entreprise sélectionnée
      let entrepriseId = entreprise?.id
      if (!entrepriseId && form.entreprise_nom) {
        const { data: ent } = await supabase
          .from('entreprises')
          .insert({ nom: form.entreprise_nom, type: form.entreprise_type || '' })
          .select().single()
        entrepriseId = ent?.id
      }
      const { data } = await supabase
        .from('contacts')
        .insert({ nom: form.nom, prenom: form.prenom, email: form.email, telephone: form.telephone, fonction: form.fonction, entreprise_id: entrepriseId, note: form.note, interlocuteur_principal: form.interlocuteur === 'Oui' })
        .select()
        .single()
      nouvelElement = data
    } else if (type === 'entreprise') {
      const { data } = await supabase
        .from('entreprises')
        .insert({ nom: form.nom, type: form.type, siret: form.siret, adresse: form.adresse })
        .select()
        .single()
      nouvelElement = data
    }

    setLoading(false)
    if (nouvelElement) onSelect(nouvelElement)
  }

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--blanc)', borderRadius: '16px 16px 0 0',
        width: '100%', maxWidth: 600, maxHeight: '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--bordure)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{titres[type]}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--texte-sec)' }}>×</button>
        </div>

        {/* Onglets recherche / créer */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--bordure)' }}>
          <button className={`tab-btn ${vue === 'recherche' ? 'active' : ''}`} onClick={() => setVue('recherche')}>🔍 Rechercher</button>
          <button className={`tab-btn ${vue === 'creer' ? 'active' : ''}`} onClick={() => setVue('creer')}>+ Créer nouveau</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

          {vue === 'recherche' && (
            <>
              <input
                className="form-input"
                placeholder={type === 'collaborateur' ? 'Nom, prénom ou email…' : type === 'contact' ? 'Nom, prénom ou fonction…' : 'Nom de l\'entreprise…'}
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                autoFocus
              />
              {loading && <div className="loading" style={{ padding: '12px 0' }}>Recherche…</div>}
              {!loading && recherche.length >= 2 && resultats.length === 0 && (
                <div style={{ color: 'var(--texte-sec)', fontSize: 13, padding: '16px 0', textAlign: 'center' }}>
                  Aucun résultat — <button onClick={() => setVue('creer')} style={{ background: 'none', border: 'none', color: 'var(--orange)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Créer une nouvelle fiche</button>
                </div>
              )}
              {resultats.map(r => (
                <div key={r.id} className="list-item" onClick={() => onSelect(r)}>
                  {type !== 'entreprise'
                    ? <Avatar nom={r.nom} prenom={r.prenom} />
                    : <Avatar nom={r.nom} prenom="" square size={36} />
                  }
                  <div className="item-info">
                    {type === 'collaborateur' && <>
                      <div className="item-nom">{r.prenom} {r.nom}</div>
                      <div className="item-sub">{r.role} · {r.email}</div>
                    </>}
                    {type === 'contact' && <>
                      <div className="item-nom">{r.prenom} {r.nom}</div>
                      <div className="item-sub">{r.fonction} · {r.entreprises?.nom}</div>
                    </>}
                    {type === 'entreprise' && <>
                      <div className="item-nom">{r.nom}</div>
                      <div className="item-sub">{r.type}</div>
                    </>}
                  </div>
                  <span style={{ color: 'var(--orange)', fontSize: 13, fontWeight: 500 }}>Ajouter</span>
                </div>
              ))}
            </>
          )}

          {vue === 'creer' && (
            <>
              {/* Formulaire collaborateur */}
              {type === 'collaborateur' && <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">Prénom *</label><input className="form-input" value={form.prenom || ''} onChange={e => setF('prenom', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Nom *</label><input className="form-input" value={form.nom || ''} onChange={e => setF('nom', e.target.value)} /></div>
                </div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email || ''} onChange={e => setF('email', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" value={form.telephone || ''} onChange={e => setF('telephone', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Rôle</label>
                  <select className="form-input" value={form.role || ''} onChange={e => setF('role', e.target.value)}>
                    <option value="">Choisir…</option>
                    <option>Associé</option><option>Pilote référent</option><option>Architecte</option>
                    <option>Dessinateur</option><option>Chef de projet</option><option>Ingénieur</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Spécialité</label><input className="form-input" value={form.specialite || ''} onChange={e => setF('specialite', e.target.value)} /></div>
              </>}

              {/* Formulaire contact */}
              {type === 'contact' && <>
                {!entreprise && <>
                  <div className="form-group"><label className="form-label">Entreprise *</label><input className="form-input" placeholder="Nom de l'entreprise" value={form.entreprise_nom || ''} onChange={e => setF('entreprise_nom', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Type d'entreprise</label><input className="form-input" placeholder="Gros œuvre, Électricité…" value={form.entreprise_type || ''} onChange={e => setF('entreprise_type', e.target.value)} /></div>
                </>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">Prénom *</label><input className="form-input" value={form.prenom || ''} onChange={e => setF('prenom', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Nom *</label><input className="form-input" value={form.nom || ''} onChange={e => setF('nom', e.target.value)} /></div>
                </div>
                <div className="form-group"><label className="form-label">Fonction</label><input className="form-input" value={form.fonction || ''} onChange={e => setF('fonction', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Téléphone</label><input className="form-input" value={form.telephone || ''} onChange={e => setF('telephone', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email || ''} onChange={e => setF('email', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Interlocuteur principal</label>
                  <select className="form-input" value={form.interlocuteur || 'Non'} onChange={e => setF('interlocuteur', e.target.value)}>
                    <option>Non</option><option>Oui</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Note</label><textarea className="form-input" value={form.note || ''} onChange={e => setF('note', e.target.value)} /></div>
              </>}

              {/* Formulaire entreprise */}
              {type === 'entreprise' && <>
                <div className="form-group"><label className="form-label">Nom de l'entreprise *</label><input className="form-input" value={form.nom || ''} onChange={e => setF('nom', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Type / Lot</label><input className="form-input" placeholder="Gros œuvre, Électricité, BET…" value={form.type || ''} onChange={e => setF('type', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">SIRET</label><input className="form-input" value={form.siret || ''} onChange={e => setF('siret', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Adresse</label><input className="form-input" value={form.adresse || ''} onChange={e => setF('adresse', e.target.value)} /></div>
              </>}

              <div className="btn-row">
                <button className="btn-save" onClick={creer} disabled={loading}>
                  {loading ? 'Création…' : 'Créer et ajouter'}
                </button>
                <button className="btn-cancel" onClick={onClose}>Annuler</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
