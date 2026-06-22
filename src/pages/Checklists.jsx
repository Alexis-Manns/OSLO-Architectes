import React, { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Topbar from '../components/Topbar'

const ITEMS_PHASE = [
  { id: '1', texte: 'Plans d\'exécution validés',           coche: true,  meta: 'Validé par M. Laurent · 10/05/2026' },
  { id: '2', texte: 'DICT transmis aux concessionnaires',   coche: false, meta: 'En attente · Assigné à T. Dubois' },
  { id: '3', texte: 'Planning travaux validé',              coche: false, meta: 'En attente · Assigné à M. Laurent' },
  { id: '4', texte: 'Ordre de service émis',               coche: true,  meta: 'Validé par M. Laurent · 15/05/2026' },
]

const ITEMS_LOT = {
  'Gros œuvre':   [
    { id: '1', texte: 'Fondations réalisées et contrôlées', coche: true,  meta: 'Validé · 02/05/2026' },
    { id: '2', texte: 'Dalles R+1 coulées',                coche: false, meta: 'En attente' },
    { id: '3', texte: 'Maçonnerie façades terminée',       coche: false, meta: 'En attente · T. Dubois' },
  ],
  'Menuiseries':  [
    { id: '1', texte: 'Menuiseries ext. posées — RDC',     coche: true,  meta: 'Validé · 10/05/2026' },
    { id: '2', texte: 'Menuiseries ext. posées — R+1',     coche: false, meta: 'En attente' },
  ],
  'Électricité': [
    { id: '1', texte: 'Gaines électriques passées',        coche: true,  meta: 'Validé · 05/05/2026' },
    { id: '2', texte: 'Tableau général posé',              coche: false, meta: 'En attente' },
  ],
  'CVC': [
    { id: '1', texte: 'Gaines CVC posées',                 coche: false, meta: 'En attente' },
    { id: '2', texte: 'VMC installée',                     coche: false, meta: 'En attente' },
  ],
}

export default function Checklists() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }
  const [onglet, setOnglet] = useState('phase')
  const [lot, setLot] = useState('Gros œuvre')
  const [itemsPhase, setItemsPhase] = useState(ITEMS_PHASE)
  const [itemsLot, setItemsLot] = useState(ITEMS_LOT)

  function togglePhase(itemId) {
    setItemsPhase(items => items.map(i => i.id === itemId ? { ...i, coche: !i.coche } : i))
  }
  function toggleLot(itemId) {
    setItemsLot(prev => ({
      ...prev,
      [lot]: prev[lot].map(i => i.id === itemId ? { ...i, coche: !i.coche } : i)
    }))
  }

  return (
    <div className="page">
      <Topbar
        breadcrumb={[
          { label: 'Mes projets', path: '/' },
          { label: projet.nom, path: `/projet/${id}` },
          { label: 'Checklists' },
        ]}
        phase={projet.phase}
      />
      <div className="content">
        <div className="tabs">
          <button className={`tab-btn ${onglet === 'phase' ? 'active' : ''}`} onClick={() => setOnglet('phase')}>Par phase — {projet.phase}</button>
          <button className={`tab-btn ${onglet === 'lot' ? 'active' : ''}`} onClick={() => setOnglet('lot')}>Par lot</button>
        </div>

        {onglet === 'phase' && (
          <>
            {itemsPhase.map(item => (
              <div key={item.id} className="check-item">
                <input type="checkbox" checked={item.coche} onChange={() => togglePhase(item.id)} />
                <div>
                  <div className={`check-label ${item.coche ? 'done' : ''}`}>{item.texte}</div>
                  <div className="check-meta">{item.meta}</div>
                </div>
              </div>
            ))}
            <button className="btn-add">+ Ajouter un item</button>
          </>
        )}

        {onglet === 'lot' && (
          <>
            <div className="subtabs">
              {Object.keys(ITEMS_LOT).map(l => (
                <button key={l} className={`subtab ${lot === l ? 'active' : ''}`} onClick={() => setLot(l)}>{l}</button>
              ))}
            </div>
            {(itemsLot[lot] || []).map(item => (
              <div key={item.id} className="check-item">
                <input type="checkbox" checked={item.coche} onChange={() => toggleLot(item.id)} />
                <div>
                  <div className={`check-label ${item.coche ? 'done' : ''}`}>{item.texte}</div>
                  <div className="check-meta">{item.meta}</div>
                </div>
              </div>
            ))}
            <button className="btn-add">+ Ajouter un item</button>
          </>
        )}
      </div>
    </div>
  )
}
