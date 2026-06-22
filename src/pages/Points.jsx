import React, { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Topbar from '../components/Topbar'

const DEMO_POINTS = [
  { id: '1', titre: 'Infiltration eau toiture — Bât. B', statut: 'Ouvert',    priorite: 'Haute',   date: '18/05/2026', auteur: 'M. Laurent', maj: true },
  { id: '2', titre: 'Non-conformité armatures béton R+3', statut: 'En suivi', priorite: 'Moyenne', date: '10/05/2026', auteur: 'T. Dubois',  maj: false },
  { id: '3', titre: 'Retard planning menuiseries',        statut: 'Résolu',   priorite: 'Faible',  date: '02/04/2026', auteur: 'M. Laurent', maj: false },
]

const STATUT_DOT = { 'Ouvert': 'dot-rouge', 'En suivi': 'dot-orange', 'Résolu': 'dot-vert' }
const STATUT_BADGE = {
  'Ouvert':    { bg: '#FCEBEB', color: '#A32D2D' },
  'En suivi':  { bg: '#FAEEDA', color: '#854F0B' },
  'Résolu':    { bg: '#EAF3DE', color: '#3B6D11' },
}

export default function Points() {
  const navigate = useNavigate()
  const { id } = useParams()
  const location = useLocation()
  const projet = location.state?.projet || { nom: 'Projet', phase: 'EXE' }

  return (
    <div className="page">
      <Topbar
        breadcrumb={[
          { label: 'Mes projets', path: '/' },
          { label: projet.nom, path: `/projet/${id}` },
          { label: 'Points Critiques' },
        ]}
        phase={projet.phase}
      />
      <div className="content">
        {DEMO_POINTS.map(p => {
          const bs = STATUT_BADGE[p.statut] || {}
          return (
            <div key={p.id} className="list-item" style={{ alignItems: 'flex-start', padding: '12px' }}
              onClick={() => navigate(`/projet/${id}/points/${p.id}`, { state: { projet, point: p } })}>
              <div className={`statut-dot ${STATUT_DOT[p.statut]}`} style={{ marginTop: 4 }} />
              <div className="item-info">
                <div className="item-nom">{p.titre}</div>
                <div className="item-sub">Signalé le {p.date} · {p.auteur}</div>
                <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: bs.bg, color: bs.color }}>{p.statut}</span>
                  {p.priorite === 'Haute' && <span className="badge badge-rouge">Haute priorité</span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {p.maj && <span className="badge badge-orange" style={{ fontSize: 10 }}>MAJ</span>}
                <span className="arrow">›</span>
              </div>
            </div>
          )
        })}
        <button className="btn-add">+ Nouveau point critique</button>
      </div>
    </div>
  )
}
