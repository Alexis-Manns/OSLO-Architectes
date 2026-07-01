import React, { useState, useEffect, useRef } from 'react'
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
  const [uploadingId, setUploadingId] = useState(null)
  const fileRefs = useRef({})

  useEffect(() => { chargerProjets() }, [])

  async function chargerProjets() {
    const { data, error } = await supabase
      .from('projets')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    setProjets(data || [])
    setLoading(false)
  }

  async function handleImageUpload(e, projetId) {
    const file = e.target.files[0]
    if (!file) return
    setUploadingId(projetId)

    // Upload dans Supabase Storage
    const ext = file.name.split('.').pop()
    const path = `projets/${projetId}/cover.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      console.error(uploadError)
      setUploadingId(null)
      return
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
    const image_url = urlData.publicUrl

    // Mettre à jour la BDD
    await supabase.from('projets').update({ image_url }).eq('id', projetId)

    // Mettre à jour l'état local
    setProjets(prev => prev.map(p => p.id === projetId ? { ...p, image_url } : p))
    setUploadingId(null)
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
                <div key={p.id} className="card">
                  {/* Zone image cliquable pour upload */}
                  <div
                    className="projet-img"
                    style={{ position: 'relative', cursor: 'pointer' }}
                    onClick={e => {
                      e.stopPropagation()
                      fileRefs.current[p.id]?.click()
                    }}
                    title="Cliquer pour changer l'image"
                  >
                    {uploadingId === p.id ? (
                      <div style={{ fontSize: 13, color: '#888' }}>Upload…</div>
                    ) : p.image_url ? (
                      <img src={p.image_url} alt={p.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 32 }}>{EMOJIS[i % EMOJIS.length]}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', background: 'rgba(0,0,0,0.25)', padding: '2px 8px', borderRadius: 10 }}>+ Photo</span>
                      </div>
                    )}
                    {/* Overlay au survol si image déjà présente */}
                    {p.image_url && (
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'background 0.2s', fontSize: 12, color: 'transparent'
                      }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(0,0,0,0.35)'
                          e.currentTarget.style.color = 'white'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(0,0,0,0)'
                          e.currentTarget.style.color = 'transparent'
                        }}
                      >
                        ✏️ Changer
                      </div>
                    )}
                    <input
                      ref={el => fileRefs.current[p.id] = el}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => handleImageUpload(e, p.id)}
                    />
                  </div>

                  {/* Corps de la carte — navigation vers le projet */}
                  <div
                    className="projet-body"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/projet/${p.id}`, { state: { projet: p } })}
                  >
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
