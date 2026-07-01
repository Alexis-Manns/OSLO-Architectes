import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import { supabase } from '../lib/supabase'
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
  const [confirmSuppr, setConfirmSuppr] = useState(null) // { type, id, nom }

  useEffect(() => { charger() }, [id])

  async function charger() {
    setLoading(true)
    const { data: affectations } = await supabase
      .from('affectations')
      .select('*, collaborateurs(*)')
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
    // Supprimer toutes les affectations de contacts de cette entreprise sur ce projet
    const contactIds = entreprise.contacts.map(c => c.affectation_id)
    if (contactIds.length > 0) {
      await supabase.from('affectations_contacts').delete().in('id', contactIds)
    }
    setConfirmSuppr(null)
    charger()
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

  async function ajouterEntreprise(entreprise) {
    // Entreprise créée — on propose d'ajouter un premier contact
    setModal(null)
    await charger()
    setEntrepriseSelectee(entreprise)
    setTimeout(() => setModal('contact'), 200)
  }

  function toggleEntr(eid) {
    setDeplies(d => ({ ...d, [eid]: !d[eid] }))
  }

  if (loading) return (
    <div className="page">
      <Topbar breadcrumb={[{ label: 'Mes projets', path: '/' }, { label: projet.nom, path: `/projet/${id}` }, { label: 'Collaborateurs' }]} phase={projet.phase} />
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

        {onglet === 'agence' && (
          <>
            {collabs.length === 0 && (
              <div style={{ color: 'var(--texte-sec)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                Aucun collaborateur affecté à ce projet
              </div>
            )}
            {collabs.map(c => (
              <div key={c.id} className="list-item" style={{ gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}
                  onClick={() => navigate(`/projet/${id}/collaborateurs/${c.id}`, { state: { projet, collab: c } })}>
                  <Avatar nom={c.nom} prenom={c.prenom} />
                  <div className="item-info">
                    <div className="item-nom">{c.prenom} {c.nom}</div>
                    <div className="item-sub">{c.role_projet} · {c.email}</div>
                  </div>
                  <span className="arrow">›</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setConfirmSuppr({ type: 'collab', data: c, nom: `${c.prenom} ${c.nom}` }) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 18, padding: '4px 6px', flexShrink: 0, borderRadius: 6 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#E24B4A'}
                  onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
                  title="Retirer du projet"
                >✕</button>
              </div>
            ))}
            <button className="btn-add" onClick={() => setModal('collab')}>+ Ajouter un collaborateur</button>
          </>
        )}

        {onglet === 'entreprises' && (
          <>
            {entreprises.length === 0 && (
              <div style={{ color: 'var(--texte-sec)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                Aucune entreprise liée à ce projet
              </div>
            )}
            {entreprises.map(e => (
              <div key={e.id}>
                <div className="entr-row">
                  <span style={{ fontStyle: 'normal', color: 'var(--texte-sec)', cursor: 'pointer' }}
                    onClick={() => toggleEntr(e.id)}>
                    {deplies[e.id] ? '▾' : '›'}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer' }}
                    onClick={() => toggleEntr(e.id)}>
                    <Avatar nom={e.nom} prenom="" square size={36} />
                    <div className="item-info">
                      <div className="item-nom">{e.nom}</div>
                      <div className="item-sub">{e.type}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setConfirmSuppr({ type: 'entreprise', data: e, nom: e.nom })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 18, padding: '4px 6px', borderRadius: 6 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#E24B4A'}
                    onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
                    title="Retirer du projet"
                  >✕</button>
                </div>

                {deplies[e.id] && (
                  <div className="contact-indent">
                    {e.contacts.map(c => (
                      <div key={c.id} className="list-item" style={{ gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}
                          onClick={() => navigate(`/projet/${id}/contacts/${c.id}`, { state: { projet, contact: c, entreprise: e } })}>
                          <Avatar nom={c.nom} prenom={c.prenom} size={34} />
                          <div className="item-info">
                            <div className="item-nom">{c.prenom} {c.nom}</div>
                            <div className="item-sub">{c.fonction} · {c.telephone}</div>
                          </div>
                          <span className="arrow">›</span>
                        </div>
                        <button
                          onClick={() => setConfirmSuppr({ type: 'contact', data: c, nom: `${c.prenom} ${c.nom}` })}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 18, padding: '4px 6px', borderRadius: 6, flexShrink: 0 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#E24B4A'}
                          onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
                          title="Retirer du projet"
                        >✕</button>
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

      {/* Modal confirmation suppression */}
      {confirmSuppr && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
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
                  else if (confirmSuppr.type === 'entreprise') supprimerEntreprise(confirmSuppr.data)
                }}
              >Retirer</button>
              <button className="btn-cancel" onClick={() => setConfirmSuppr(null)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Modals ajout */}
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
