import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const TYPES = ['Bug', 'Amélioration', 'Question', 'Autre']

export default function BoutonFeedback() {
  const { user, profil } = useAuth()
  const [ouvert, setOuvert] = useState(false)
  const [form, setForm] = useState({ type: 'Amélioration', titre: '', description: '' })
  const [envoi, setEnvoi] = useState(false)
  const [succes, setSucces] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function envoyer() {
    if (!form.titre.trim()) return
    setEnvoi(true)
    await supabase.from('feedbacks').insert({
      user_id:     user?.id,
      type:        form.type,
      titre:       form.titre,
      description: form.description,
      statut:      'Nouveau',
      created_at:  new Date().toISOString(),
    })
    setEnvoi(false)
    setSucces(true)
    setTimeout(() => {
      setSucces(false)
      setOuvert(false)
      setForm({ type: 'Amélioration', titre: '', description: '' })
    }, 2000)
  }

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOuvert(true)}
        title="Envoyer un retour"
        style={{
          position: 'fixed', bottom: 20, right: 20,
          background: '#FF8C00', color: 'white',
          border: 'none', borderRadius: 50,
          width: 48, height: 48,
          fontSize: 20, cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(255,140,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        ?
      </button>

      {/* Modal feedback */}
      {ouvert && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 400, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          padding: 16,
        }} onClick={e => e.target === e.currentTarget && setOuvert(false)}>
          <div style={{
            background: 'var(--blanc)', borderRadius: 16,
            width: '100%', maxWidth: 480,
            padding: 24, marginBottom: 8,
          }}>
            {succes ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>✓</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#3B6D11' }}>Retour envoyé !</div>
                <div style={{ fontSize: 13, color: 'var(--texte-sec)', marginTop: 4 }}>Merci pour votre retour.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Envoyer un retour</div>
                  <button onClick={() => setOuvert(false)}
                    style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--texte-sec)' }}>
                    x
                  </button>
                </div>

                {/* Type */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  {TYPES.map(t => (
                    <button key={t} onClick={() => set('type', t)} style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12,
                      cursor: 'pointer', fontFamily: 'inherit',
                      border: form.type === t ? '2px solid #FF8C00' : '1px solid var(--bordure)',
                      background: form.type === t ? '#FFF3E0' : 'none',
                      color: form.type === t ? '#FF8C00' : 'var(--texte-sec)',
                      fontWeight: form.type === t ? 600 : 400,
                    }}>{t}</button>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label">Titre *</label>
                  <input className="form-input" value={form.titre}
                    onChange={e => set('titre', e.target.value)}
                    placeholder="Ex: Le bouton Enregistrer ne fonctionne pas..."
                    autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optionnel)</label>
                  <textarea className="form-input" value={form.description}
                    onChange={e => set('description', e.target.value)}
                    placeholder="Décrivez le problème ou l'idée en détail..."
                    rows={3} />
                </div>

                <div style={{ fontSize: 12, color: 'var(--texte-sec)', marginBottom: 14 }}>
                  Envoyé en tant que : <strong>{profil?.prenom} {profil?.nom}</strong>
                </div>

                <div className="btn-row">
                  <button className="btn-save" onClick={envoyer} disabled={envoi || !form.titre.trim()}>
                    {envoi ? 'Envoi...' : 'Envoyer'}
                  </button>
                  <button className="btn-cancel" onClick={() => setOuvert(false)}>Annuler</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
