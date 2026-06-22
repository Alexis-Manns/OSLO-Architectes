import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import Topbar from '../components/Topbar'
import Avatar from '../components/Avatar'
import { supabase } from '../lib/supabase'

const DEMO_COLLABS = [
  { id: '1', nom: 'Laurent', prenom: 'Marie',   role_projet: 'Cheffe de projet', email: 'm.laurent@oslo-arch.fr', maj: true },
  { id: '2', nom: 'Dubois',  prenom: 'Thomas',  role_projet: 'Architecte',       email: 't.dubois@oslo-arch.fr',  maj: false },
  { id: '3', nom: 'Chen',    prenom: 'Sophie',  role_projet: 'Dessinatrice',      email: 's.chen@oslo-arch.fr',    maj: false },
]

const DEMO_ENTREPRISES = [
  {
    id: 'e1', nom: 'BTP Construction', type: 'Gros œuvre', maj: true,
    contacts: [
      { id: 'c1', nom: 'Martin',  prenom: 'Jean',    fonction: 'Conducteur de travaux', telephone: '06 12 34 56 78', maj: true },
      { id: 'c2', nom: 'Roux',    prenom: 'Claire',  fonction: 'Directrice commerciale', telephone: '06 98 76 54 32', maj: false },
    ]
  },
  {
    id: 'e2', nom: 'Électro Services', type: 'Électricité', maj: false,
    contacts: [
      { id: 'c3', nom: 'Bernard', prenom: 'Pierre',  fonction: 'Gérant', telephone: '06 55 44 33 22', maj: false },
    ]
  },
]

export default function Collaborateurs() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }
  const [onglet, setOnglet] = useState('agence')
  const [collabs, setCollabs] = useState(DEMO_COLLABS)
  const [entreprises, setEntreprises] = useState(DEMO_ENTREPRISES)
  const [deplies, setDeplies] = useState({})

  function toggleEntr(eid) {
    setDeplies(d => ({ ...d, [eid]: !d[eid] }))
  }

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
            {collabs.map(c => (
              <div key={c.id} className="list-item" onClick={() => navigate(`/projet/${id}/collaborateurs/${c.id}`, { state: { projet, collab: c } })}>
                <Avatar nom={c.nom} prenom={c.prenom} />
                <div className="item-info">
                  <div className="item-nom">{c.prenom} {c.nom}</div>
                  <div className="item-sub">{c.role_projet} · {c.email}</div>
                </div>
                {c.maj && <span className="badge badge-orange" style={{ fontSize: 10 }}>MAJ</span>}
                <span className="arrow">›</span>
              </div>
            ))}
            <button className="btn-add">+ Ajouter un collaborateur</button>
          </>
        )}

        {onglet === 'entreprises' && (
          <>
            {entreprises.map(e => (
              <div key={e.id}>
                <div className="entr-row" onClick={() => toggleEntr(e.id)}>
                  <span className="chevron" style={{ fontStyle: 'normal' }}>{deplies[e.id] ? '▾' : '›'}</span>
                  <Avatar nom={e.nom} prenom="" square size={36} />
                  <div className="item-info">
                    <div className="item-nom">{e.nom}</div>
                    <div className="item-sub">{e.type}</div>
                  </div>
                  {e.maj && <span className="badge badge-orange" style={{ fontSize: 10 }}>MAJ</span>}
                </div>
                {deplies[e.id] && (
                  <div className="contact-indent">
                    {e.contacts.map(c => (
                      <div key={c.id} className="list-item" onClick={() => navigate(`/projet/${id}/contacts/${c.id}`, { state: { projet, contact: c, entreprise: e } })}>
                        <Avatar nom={c.nom} prenom={c.prenom} size={34} />
                        <div className="item-info">
                          <div className="item-nom">{c.prenom} {c.nom}</div>
                          <div className="item-sub">{c.fonction} · {c.telephone}</div>
                        </div>
                        {c.maj && <span className="badge badge-orange" style={{ fontSize: 10 }}>MAJ</span>}
                        <span className="arrow">›</span>
                      </div>
                    ))}
                    <button className="btn-add" style={{ marginBottom: 8 }}>+ Ajouter un contact</button>
                  </div>
                )}
              </div>
            ))}
            <button className="btn-add">+ Ajouter une entreprise</button>
          </>
        )}
      </div>
    </div>
  )
}
