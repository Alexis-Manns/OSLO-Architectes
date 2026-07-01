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
  const [modal, setModal] = useState(null) // 'collab' | 'contact' | 'entreprise'
  const [entrepriseSelectee, setEntrepriseSelectee] = useState(null)

  useEffect(() => { charger() }, [id])

  async function charger() {
    setLoading(true)

    // Collaborateurs affectés au projet
    const { data: affectations } = await supabase
      .from('affectations')
      .select('*, collaborateurs(*)')
      .eq('projet_id', id)

    // Entreprises et contacts affectés au projet
    const { data: affContacts } = await supabase
      .from('affectations_contacts')
      .select('*, contacts(*, entreprises(*))')
      .eq('projet_id', id)

    setCollabs(affectations?.map(a => ({ ...a.collaborateurs, role_projet: a.role_sur_projet, affectation_id: a.id })) || [])

    // Regrouper contacts par entreprise
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

  async function ajouterCollab(collab) {
    // Affecter le collaborateur au projet
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
    // Affecter le contact au projet
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
    // L'entreprise est liée via ses contacts — on ferme juste le modal
    // et on invite à ajouter un contact de cette entreprise
    setModal(null)
    charger()
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
              <div key={c.id} className="list-item"
                onClick={() => navigate(`/projet/${id}/collaborateurs/${c.id}`, { state: { projet, collab: c } })}>
                <Avatar nom={c.nom} prenom={c.prenom} />
                <div className="item-info">
                  <div className="item-nom">{c.prenom} {c.nom}</div>
                  <div className="item-sub">{c.role_projet} · {c.email}</div>
                </div>
                <span className="arrow">›</span>
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
                <div className="entr-row" onClick={() => toggleEntr(e.id)}>
                  <span style={{ fontStyle: 'normal', color: 'var(--texte-sec)' }}>{deplies[e.id] ? '▾' : '›'}</span>
                  <Avatar nom={e.nom} prenom="" square size={36} />
                  <div className="item-info">
                    <div className="item-nom">{e.nom}</div>
                    <div className="item-sub">{e.type}</div>
                  </div>
                </div>
                {deplies[e.id] && (
                  <div className="contact-indent">
                    {e.contacts.map(c => (
                      <div key={c.id} className="list-item"
                        onClick={() => navigate(`/projet/${id}/contacts/${c.id}`, { state: { projet, contact: c, entreprise: e } })}>
                        <Avatar nom={c.nom} prenom={c.prenom} size={34} />
                        <div className="item-info">
                          <div className="item-nom">{c.prenom} {c.nom}</div>
                          <div className="item-sub">{c.fonction} · {c.telephone}</div>
                        </div>
                        <span className="arrow">›</span>
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

      {/* Modals de recherche/création */}
      {modal === 'collab' && (
        <ModalRecherche
          type="collaborateur"
          projetId={id}
          onSelect={ajouterCollab}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'contact' && (
        <ModalRecherche
          type="contact"
          projetId={id}
          entreprise={entrepriseSelectee}
          onSelect={ajouterContact}
          onClose={() => { setModal(null); setEntrepriseSelectee(null) }}
        />
      )}
      {modal === 'entreprise' && (
        <ModalRecherche
          type="entreprise"
          projetId={id}
          onSelect={ajouterEntreprise}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
