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
  const [hoveredId, setHoveredId] = useState(null)
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

  async function handleImageUpload(e, projet) {
    const file = e.target.files[0]
    if (!file) return
    e.target.value = ''
    setUploadingId(projet.id)

    const ext = file.name.split('.').pop()
    const path = `projets/${projet.id}/cover.${ext}`

    // Supprimer l'ancienne image
    const { data: existingFiles } = await supabase.storage
      .from('Photos')
      .list(`projets/${projet.id}`)
    if (existingFiles && existingFiles.length > 0) {
      const toDelete = existingFiles.map(f => `projets/${projet.id}/${f.name}`)
      await supabase.storage.from('Photos').remove(toDelete)
    }

    // Upload nouvelle image
    const { error: uploadError } = await supabase.storage
      .from('Photos')
      .upload(path, file)

    if (uploadError) {
      console.error(uploadError)
      setUploadingId(null)
      return
    }

    const { data: urlData } = supabase.storage.from('Photos').getPublicUrl(path)
    const image_url = `${urlData.publicUrl}?t=${Date.now()}`

    await supabase.from('projets').update({ image_url }).eq('id', projet.id)
    setProjets(prev => prev.map(p => p.id === projet.id ? { ...p, image_url } : p))
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
              const isHovered = hoveredId === p.id
              const isUploading = uploadingId === p.id

              return (
                <div key={p.id} className="card">
                  {/* Zone image */}
                  <div
                    className="projet-img"
                    style={{ position: 'relative', cursor: 'pointer' }}
                    onClick={e => { e.stopPropagation(); fileRefs.current[p.id]?.click() }}
                    onMouseEnter={() => setHoveredId(p.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {isUploading ? (
                      <div style={{ fontSize: 13, color: '#888' }}>⏳ Upload…</div>
                    ) : p.image_url ? (
                      <>
                        <img
                          src={p.image_url}
                          alt={p.nom}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        {/* Overlay visible uniquement au survol */}
                        {isHovered && (
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'rgba(0,0,0,0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: 13, fontWeight: 500, gap: 6
                          }}>
                            ✏️ Changer la photo
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 32 }}>{EMOJIS[i % EMOJIS.length]}</span>
                        <span style={{
                          fontSize: 11, color: 'rgba(255,255,255,0.95)',
                          background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 10
                        }}>+ Photo</span>
                      </div>
                    )}
                    <input
                      ref={el => fileRefs.current[p.id] = el}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={e => handleImageUpload(e, p)}
                    />
                  </div>

                  {/* Corps — navigation */}
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
