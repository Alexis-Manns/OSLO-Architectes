import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import { supabase } from '../lib/supabase'
import { useRealtime } from '../hooks/useRealtime'
import ModalRecherche from '../components/ModalRecherche'

export default function Collaborateurs() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }

  const [onglet, setOnglet] = useState('agence')
  const [collabs, setCollabs] = useState([])
  const [entreprises, setEntreprises] = useState([])
  const [deplies, setDeplies] = useState({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [entrepriseSelectee, setEntrepriseSelectee] = useState(null)
  const [confirmSuppr, setConfirmSuppr] = useState(null)

  useRealtime('affectations', charger)
  useEffect(() => { charger() }, [id])

  async function charger() {
    setLoading(true)

    const { data: affectations } = await supabase
      .from('affectations')
      .select('*, collaborateurs(*)')
      .eq('projet_id', id)

    const { data: affEntreprises } = await supabase
      .from('affectations_entreprises')
      .select('*, entreprises(*)')
      .eq('projet_id', id)

    const { data: affContacts } = await supabase
      .from('affectations_contacts')
      .select('*, contacts(*, entreprises(*))')
      .eq('projet_id', id)

    setCollabs(affectations?.map(a => ({
      ...a.collaborateurs,
      role_projet: a.role_sur_projet,
      affectation_id: a.id
    })) || [])

    const entreprisesMap = {}

    affEntreprises?.forEach(ae => {
      if (!ae.entreprises) return
      entreprisesMap[ae.entreprises.id] = {
        ...ae.entreprises,
        affectation_entreprise_id: ae.id,
        contacts: []
      }
    })

    affContacts?.forEach(ac => {
      const contact = ac.contacts
      const entreprise = contact?.entreprises
      if (!entreprise) return
      if (!entreprisesMap[entreprise.id]) {
        entreprisesMap[entreprise.id] = { ...entreprise, contacts: [] }
      }
      entreprisesMap[entreprise.id].contacts.push({
        ...contact,
        lot: ac.lot,
        role: ac.role,
        affectation_id: ac.id
      })
    })

    setEntreprises(Object.values(entreprisesMap))
    setLoading(false)
  }

  async function ajouterCollab(collab) {
    await supabase.from('affectations').insert({
      projet_id: id,
      collaborateur_id: collab.id,
      role_sur_projet: collab.role || 'Collaborateur',
      date_affectation: new Date().toISOString()
    })
    setModal(null)
    charger()
  }

  async function ajouterEntreprise(entreprise) {
    await supabase.from('affectations_entreprises').insert({
      projet_id: id,
      entreprise_id: entreprise.id
    })
    setModal(null)
    await charger()
    setDeplies(d => ({ ...d, [entreprise.id]: true }))
  }

  async function ajouterContact(contact) {
    await supabase.from('affectations_contacts').insert({
      projet_id: id,
      contact_id: contact.id,
      lot: '',
      role: contact.fonction || ''
    })
    setModal(null)
    setEntrepriseSelectee(null)
    charger()
  }

  async function supprimerCollab(collab) {
    await supabase.from('affectations').delete().eq('id', collab.affectation_id)
    setConfirmSuppr(null)
    charger()
  }

  async function supprimerContact(contact) {
    await supabase.from('affectations_contacts').delete().eq('id', contact.affectation_id)
    setConfirmSuppr(null)
    charger()
  }

  async function supprimerEntreprise(entreprise) {
    if (entreprise.affectation_entreprise_id) {
      await supabase.from('affectations_entreprises').delete().eq('id', entreprise.affectation_entreprise_id)
    }
    const contactIds = entreprise.contacts.map(c => c.affectation_id).filter(Boolean)
    if (contactIds.length > 0) {
      await supabase.from('affectations_contacts').delete().in('id', contactIds)
    }
    setConfirmSuppr(null)
    charger()
  }

  function toggleEntr(eid) {
    setDeplies(d => ({ ...d, [eid]: !d[eid] }))
  }

  const BtnSuppr = ({ onClick }) => (
    <button
      onClick={onClick}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ddd', fontSize: 18, padding: '4px 6px', borderRadius: 6, flexShrink: 0 }}
      onMouseEnter={e => e.currentTarget.style.color = '#E24B4A'}
      onMouseLeave={e => e.currentTarget.style.color = '#ddd'}
    >✕</button>
  )

  if (loading) return (
    <div className="page">
      <Topbar breadcrumb={[
        { label: 'Mes projets', path: '/' },
        { label: projet.nom, path: `/projet/${id}` },
        { label: 'Collaborateurs' }
      ]} phase={projet.phase} />
      <div className="content"><div className="loading">Chargement…</div></div>
    </div>
  )

  return (
    <div className="page">
      <Topbar
        breadcrumb={[
          { label: 'Mes projets', path: '/' },
          { label: projet.nom, path: `/projet/${id}` },
          { label: 'Collaborateurs' },
        ]}
        phase={projet.phase}
      />
      <div className="content">
        <div className="tabs">
          <button className={`tab-btn ${onglet === 'agence' ? 'active' : ''}`} onClick={() => setOnglet('agence')}>Agence</button>
          <button className={`tab-btn ${onglet === 'entreprises' ? 'active' : ''}`} onClick={() => setOnglet('entreprises')}>Entreprises &amp; BE</button>
        </div>

        {/* ── ONGLET AGENCE ── */}
        {onglet === 'agence' && (
          <>
            {collabs.length === 0 && (
              <div style={{ color: 'var(--texte-sec)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                Aucun collaborateur affecté à ce projet
              </div>
            )}
            {collabs.map(c => (
              <div key={c.id} className="list-item" style={{ gap: 8 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}
                  onClick={() => navigate(`/projet/${id}/collaborateurs/${c.id}`, { state: { projet, collab: c } })}
                >
                  <Avatar nom={c.nom} prenom={c.prenom} />
                  <div className="item-info">
                    <div className="item-nom">{c.prenom} {c.nom}</div>
                    <div className="item-sub">
                      {c.role_projet}
                      {c.telephone ? ' · ' + c.telephone : ''}
                      {c.email ? ' · ' + c.email : ''}
                    </div>
                  </div>
                  <span className="arrow">›</span>
                </div>
                <BtnSuppr onClick={() => setConfirmSuppr({ type: 'collab', data: c, nom: `${c.prenom} ${c.nom}` })} />
              </div>
            ))}
            <button className="btn-add" onClick={() => setModal('collab')}>+ Ajouter un collaborateur</button>
          </>
        )}

        {/* ── ONGLET ENTREPRISES ── */}
        {onglet === 'entreprises' && (
          <>
            {entreprises.length === 0 && (
              <div style={{ color: 'var(--texte-sec)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                Aucune entreprise liée à ce projet
              </div>
            )}
            {entreprises.map(e => (
              <div key={e.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="entr-row" style={{ flex: 1 }} onClick={() => toggleEntr(e.id)}>
                    <span style={{ fontStyle: 'normal', color: 'var(--texte-sec)', marginRight: 4 }}>
                      {deplies[e.id] ? '▾' : '›'}
                    </span>
                    <Avatar nom={e.nom} prenom="" square size={36} />
                    <div className="item-info">
                      <div className="item-nom">{e.nom}</div>
                      <div className="item-sub">
                        {e.type} · {e.contacts.length} contact{e.contacts.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <BtnSuppr onClick={() => setConfirmSuppr({ type: 'entreprise', data: e, nom: e.nom })} />
                </div>

                {deplies[e.id] && (
                  <div className="contact-indent">
                    {e.contacts.length === 0 && (
                      <div style={{ color: 'var(--texte-sec)', fontSize: 12, padding: '8px 0' }}>
                        Aucun contact pour l'instant
                      </div>
                    )}
                    {e.contacts.map(c => (
                      <div key={c.id} className="list-item" style={{ gap: 8 }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}
                          onClick={() => navigate(`/projet/${id}/contacts/${c.id}`, { state: { projet, contact: c, entreprise: e } })}
                        >
                          <Avatar nom={c.nom} prenom={c.prenom} size={34} />
                          <div className="item-info">
                            <div className="item-nom">
                              {c.prenom} {c.nom}
                              {c.interlocuteur_principal && (
                                <span style={{
                                  marginLeft: 7, fontSize: 10,
                                  background: '#EAF3DE', color: '#3B6D11',
                                  padding: '2px 7px', borderRadius: 10, fontWeight: 500
                                }}>
                                  Principal
                                </span>
                              )}
                            </div>
                            <div className="item-sub">
                              {c.fonction}
                              {c.telephone ? ' · ' + c.telephone : ''}
                              {c.email ? ' · ' + c.email : ''}
                            </div>
                          </div>
                          <span className="arrow">›</span>
                        </div>
                        <BtnSuppr onClick={() => setConfirmSuppr({ type: 'contact', data: c, nom: `${c.prenom} ${c.nom}` })} />
                      </div>
                    ))}
                    <button className="btn-add" style={{ marginBottom: 8 }}
                      onClick={() => { setEntrepriseSelectee(e); setModal('contact') }}>
                      + Ajouter un contact
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button className="btn-add" onClick={() => setModal('entreprise')}>+ Ajouter une entreprise</button>
          </>
        )}
      </div>

      {/* ── CONFIRMATION SUPPRESSION ── */}
      {confirmSuppr && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--blanc)', borderRadius: 12, padding: 24, maxWidth: 360, width: '100%' }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Retirer du projet</div>
            <div style={{ color: 'var(--texte-sec)', fontSize: 13, marginBottom: 20 }}>
              Voulez-vous retirer <strong>{confirmSuppr.nom}</strong> de ce projet ?
              {confirmSuppr.type === 'entreprise' && (
                <span style={{ display: 'block', marginTop: 6, color: '#E24B4A' }}>
                  Tous les contacts de cette entreprise seront également retirés.
                </span>
              )}
              <span style={{ display: 'block', marginTop: 6 }}>La fiche restera dans la base de données.</span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                style={{ background: '#E24B4A', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
                onClick={() => {
                  if (confirmSuppr.type === 'collab') supprimerCollab(confirmSuppr.data)
                  else if (confirmSuppr.type === 'contact') supprimerContact(confirmSuppr.data)
                  else supprimerEntreprise(confirmSuppr.data)
                }}
              >Retirer</button>
              <button className="btn-cancel" onClick={() => setConfirmSuppr(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODALS AJOUT ── */}
      {modal === 'collab' && (
        <ModalRecherche type="collaborateur" projetId={id} onSelect={ajouterCollab} onClose={() => setModal(null)} />
      )}
      {modal === 'contact' && (
        <ModalRecherche type="contact" projetId={id} entreprise={entrepriseSelectee} onSelect={ajouterContact} onClose={() => { setModal(null); setEntrepriseSelectee(null) }} />
      )}
      {modal === 'entreprise' && (
        <ModalRecherche type="entreprise" projetId={id} onSelect={ajouterEntreprise} onClose={() => setModal(null)} />
      )}
    </div>
  )
}
