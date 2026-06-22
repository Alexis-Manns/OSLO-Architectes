import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/Topbar'
import { supabase } from '../lib/supabase'

const PHASES_BADGES = {
  APS: { bg: '#FAECE7', color: '#993C1D' },
  APD: { bg: '#FAEEDA', color: '#854F0B' },
  PC:  { bg: '#E6F1FB', color: '#185FA5' },
  PRO: { bg: '#E6F1FB', color: '#185FA5' },
  DCE: { bg: '#FAEEDA', color: '#854F0B' },
  ACT: { bg: '#EEEDFE', color: '#534AB7' },
  EXE: { bg: '#EAF3DE', color: '#3B6D11' },
  OPR: { bg: '#FCEBEB', color: '#A32D2D' },
  AOR: { bg: '#F1EFE8', color: '#5F5E5A' },
}

const EMOJIS = ['🏢','🏗️','🏫','🏡','🏟️','📚','🏛️','🏬','🏭']

export default function Accueil() {
  const navigate = useNavigate()
  const [projets, setProjets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chargerProjets()
  }, [])

  async function chargerProjets() {
    const { data, error } = await supabase
      .from('projets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      // Données de démo si la table n'existe pas encore
      setProjets([
        { id: '1', nom: 'Résidence Les Acacias', reference: '2024-047', phase: 'EXE' },
        { id: '2', nom: 'Tour Horizon',          reference: '2023-031', phase: 'PRO' },
        { id: '3', nom: 'École Jean Moulin',     reference: '2024-012', phase: 'DCE' },
        { id: '4', nom: 'Médiathèque Nord',      reference: '2022-089', phase: 'ACT' },
        { id: '5', nom: 'Villa Solaris',         reference: '2025-003', phase: 'APS' },
        { id: '6', nom: 'Centre Sportif Est',    reference: '2023-056', phase: 'EXE' },
      ])
    } else {
      setProjets(data || [])
    }
    setLoading(false)
  }

  return (
    <div className="page">
      <Topbar breadcrumb={[{ label: 'Mes projets' }]} />
      <div className="content">
        {loading ? (
          <div className="loading">Chargement…</div>
        ) : (
          <div className="grid-projets">
            {projets.map((p, i) => {
              const badge = PHASES_BADGES[p.phase] || PHASES_BADGES.EXE
              return (
                <div
                  key={p.id}
                  className="card"
                  onClick={() => navigate(`/projet/${p.id}`, { state: { projet: p } })}
                >
                  <div className="projet-img">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : EMOJIS[i % EMOJIS.length]
                    }
                  </div>
                  <div className="projet-body">
                    <div className="projet-ref">{p.reference}</div>
                    <div className="projet-nom">{p.nom}</div>
                    <span className="badge" style={{ background: badge.bg, color: badge.color }}>
                      {p.phase}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
